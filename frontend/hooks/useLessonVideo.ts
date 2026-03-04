"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/db";

export type VideoStatus =
  | "idle"
  | "pending"
  | "queued"
  | "scripting"
  | "generating_assets"
  | "rendering"
  | "completed"
  | "failed"
  | "unavailable";

interface UseLessonVideoReturn {
  videoUrl: string | null;
  status: VideoStatus;
  progress: number;
  error: string | null;
  isLoading: boolean;
  startGeneration: () => Promise<void>;
  retry: () => void;
}

const POLL_INTERVAL_MS = 5_000; // 5 seconds
const MAX_POLL_ATTEMPTS = 180; // 15 minutes max

// Progress mapping for each status
const STATUS_PROGRESS: Record<string, number> = {
  idle: 0,
  pending: 5,
  queued: 10,
  scripting: 25,
  generating_assets: 50,
  rendering: 75,
  completed: 100,
  failed: 0,
  unavailable: 0,
};

export function useLessonVideo(
  topicId: string,
  userId: string
): UseLessonVideoReturn {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef<number>(0);
  const hasStartedRef = useRef<boolean>(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const checkVideoStatus = useCallback(async () => {
    if (!topicId) return;

    try {
      const { data: unit, error: unitError } = await supabase
        .from("lesson_units")
        .select("video_url, video_status, video_job_id, video_progress")
        .eq("topic_id", topicId)
        .maybeSingle();

      if (unitError) {
        console.error("[useLessonVideo] Error fetching unit:", unitError);
        return;
      }

      // Video already ready
      if (
        unit?.video_url &&
        (unit.video_status === "completed" || !unit.video_status)
      ) {
        setVideoUrl(unit.video_url);
        setStatus("completed");
        setProgress(unit.video_progress || 100);
        stopPolling();
        return;
      }

      // Update status and progress from database
      if (unit?.video_status) {
        setStatus(unit.video_status as VideoStatus);
        setProgress(
          unit.video_progress || STATUS_PROGRESS[unit.video_status] || 0
        );

        // Continue polling if still processing
        const processingStatuses = [
          "queued",
          "scripting",
          "generating_assets",
          "rendering",
        ];
        if (processingStatuses.includes(unit.video_status)) {
          // Poll external video API for more accurate progress
          if (unit.video_job_id) {
            try {
              const response = await fetch(
                `/api/video/status/${unit.video_job_id}`
              );
              if (response.ok) {
                const jobData = await response.json();
                if (jobData.progress !== undefined) {
                  setProgress(jobData.progress);
                }
                if (jobData.status) {
                  setStatus(jobData.status as VideoStatus);
                }

                // Video completed externally
                if (jobData.status === "completed" && jobData.videoUrl) {
                  // Update local database
                  await supabase
                    .from("lesson_units")
                    .update({
                      video_url: jobData.videoUrl,
                      video_status: "completed",
                      video_progress: 100,
                    })
                    .eq("topic_id", topicId);

                  setVideoUrl(jobData.videoUrl);
                  setStatus("completed");
                  setProgress(100);
                  stopPolling();
                  return;
                }

                // Video failed externally
                if (jobData.status === "failed") {
                  await supabase
                    .from("lesson_units")
                    .update({
                      video_status: "failed",
                    })
                    .eq("topic_id", topicId);

                  setStatus("failed");
                  setError("Video generation failed. Please try again.");
                  stopPolling();
                  return;
                }
              }
            } catch (pollError) {
              // Silent fail - will retry on next interval
              console.log(
                "[useLessonVideo] Video API poll error:",
                pollError
              );
            }
          }
        }
      }

      // Handle terminal states
      if (unit?.video_status === "failed") {
        setStatus("failed");
        setError("Video generation failed. Please try again.");
        stopPolling();
        return;
      }

      if (unit?.video_status === "unavailable") {
        setStatus("unavailable");
        setError("Video generation temporarily unavailable.");
        stopPolling();
        return;
      }

      // Max attempts reached
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        setStatus("unavailable");
        setError("Video generation timed out. Please try again later.");
        stopPolling();
      }
    } catch (err) {
      console.error("[useLessonVideo] Unexpected error:", err);
    }
  }, [topicId, stopPolling]);

  const startGeneration = useCallback(async () => {
    if (!topicId || !userId || hasStartedRef.current) return;

    hasStartedRef.current = true;
    setStatus("pending");
    setProgress(5);
    setError(null);

    try {
      // First, check if video already exists
      const { data: existing } = await supabase
        .from("lesson_units")
        .select("video_url, video_status")
        .eq("topic_id", topicId)
        .maybeSingle();

      if (existing?.video_url) {
        setVideoUrl(existing.video_url);
        setStatus("completed");
        setProgress(100);
        return;
      }

      // Get topic info for video generation
      const { data: topic } = await supabase
        .from("topics")
        .select("title, subject_name")
        .eq("id", topicId)
        .maybeSingle();

      if (!topic) {
        setStatus("failed");
        setError("Topic not found");
        return;
      }

      // Call video generation API
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `${topic.subject_name}: ${topic.title}`,
          style: "educational",
          maxDuration: 180,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // If video API is not configured, mark as unavailable
        if (
          response.status === 500 &&
          errorData.error?.includes("configuration")
        ) {
          setStatus("unavailable");
          setError("Video generation temporarily unavailable");
          // Update DB to prevent repeated attempts
          await supabase
            .from("lesson_units")
            .update({ video_status: "unavailable" })
            .eq("topic_id", topicId);
          return;
        }

        throw new Error(errorData.error || "Failed to start video generation");
      }

      const data = await response.json();

      // Update lesson_units with video job info
      await supabase
        .from("lesson_units")
        .update({
          video_job_id: data.jobId,
          video_status: "queued",
          video_progress: 10,
        })
        .eq("topic_id", topicId);

      setStatus("queued");
      setProgress(10);

      // Start polling
      stopPolling();
      attemptsRef.current = 0;
      pollRef.current = setInterval(checkVideoStatus, POLL_INTERVAL_MS);
    } catch (err: any) {
      console.error("[useLessonVideo] Generation error:", err);
      setStatus("failed");
      setError(err.message || "Failed to generate video");
    }
  }, [topicId, userId, checkVideoStatus, stopPolling]);

  const retry = useCallback(() => {
    hasStartedRef.current = false;
    attemptsRef.current = 0;
    setStatus("idle");
    setProgress(0);
    setError(null);
    setVideoUrl(null);
    stopPolling();
    startGeneration();
  }, [startGeneration, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Initial check on mount - see if video already exists
  useEffect(() => {
    if (topicId && !hasStartedRef.current) {
      checkVideoStatus();
    }
  }, [topicId, checkVideoStatus]);

  return {
    videoUrl,
    status,
    progress,
    error,
    isLoading: [
      "pending",
      "queued",
      "scripting",
      "generating_assets",
      "rendering",
    ].includes(status),
    startGeneration,
    retry,
  };
}
