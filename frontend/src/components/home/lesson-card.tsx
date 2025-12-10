// src/components/home/lesson-card.tsx
// Lesson presentation component with quiz and audio features

"use client";

import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  BookOpen,
  Play,
  Pause,
  Sparkles,
  AlertCircle,
  RefreshCw,
  LoaderIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import rateLimiter from "@/lib/rate-limiter";

interface LessonSection {
  title?: string;
  content?: string;
}

interface LessonQuizItem {
  q: string;
  options: string[];
  answer: string;
}

interface Lesson {
  id?: string;
  introduction?: string;
  classifications?: Array<{ type: string; description: string }>;
  sections?: LessonSection[];
  diagram?: string;
  quiz?: LessonQuizItem[];
}

interface StructuredLessonCardProps {
  lesson: Lesson;
  isStreamingComplete: boolean;
}

export function StructuredLessonCard({ lesson, isStreamingComplete }: StructuredLessonCardProps) {
  // Check if this is an error response
  const isErrorResponse = lesson.introduction && lesson.introduction.includes("Unable to generate a detailed lesson");
  
  // Lightly sanitize markdown-like tokens and normalize bullets per line
  const sanitizeLine = (line: string) => {
    return line
      .replaceAll("**", "")
      .replace(/^\s*[-*]\s+/, "• ")
      .replace(/`{1,3}/g, "")
      .trim();
  };

  // Normalize common section titles to a clean, consistent name
  const normalizeTitle = (title: string) => {
    const t = title.trim();
    if (/^\s*(what\s+is)\b/i.test(t)) return "Overview";
    if (/^\s*(definition)\b/i.test(t)) return "Overview";
    if (/^\s*overview\b/i.test(t)) return "Overview";
    return t.replace(/^\s*#+\s*/, "").trim();
  };
  
  const router = useRouter();
  const handleTakeQuiz = () => {
    try {
      // Check if we have a lesson ID to use the new endpoint
      if (lesson?.id) {
        // Use the new endpoint that retrieves quiz by lesson ID
        router.push(`/quiz?lessonId=${lesson.id}`);
        return;
      }
      
      // Fallback to the old method if no lesson ID is available
      if (!lesson?.quiz || !Array.isArray(lesson.quiz) || lesson.quiz.length === 0) {
        console.warn("No quiz data available", lesson?.quiz);
        return;
      }
      
      // Transform quiz data to match frontend expectations
      const transformedQuiz = lesson.quiz.map((item: any) => ({
        q: item.q || item.question || "",  // Handle both 'q' and 'question' properties
        options: Array.isArray(item.options) ? item.options : [],
        answer: item.answer || ""
      })).filter(item => item.q && item.options.length > 0);
      
      if (transformedQuiz.length === 0) {
        console.warn("No valid quiz items after transformation", lesson.quiz);
        return;
      }
      
      const data = encodeURIComponent(JSON.stringify(transformedQuiz));
      router.push(`/quiz?data=${data}`);
    } catch (err) {
      console.error("Failed to navigate to quiz:", err);
    }
  };

  // TTS state and actions
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [isQueuePreloading, setIsQueuePreloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const getFullLessonText = useCallback(() => {
    // Create blocks dynamically instead of referencing undefined variable
    const blocks: { title?: string; content: string }[] = [];
    
    if (lesson.introduction && typeof lesson.introduction === "string" && lesson.introduction.trim()) {
      blocks.push({
        title: "Introduction",
        content: lesson.introduction.trim(),
      });
    }

    if (
      Array.isArray(lesson.classifications) &&
      lesson.classifications.length > 0
    ) {
      const classificationContent = lesson.classifications
        .map((c: { type?: string; description?: string }) => {
          if (c?.type && c?.description) {
            return `• ${c.type}: ${c.description}`;
          }
          return null;
        })
        .filter(Boolean)
        .join("\n");

      if (classificationContent) {
        blocks.push({
          title: "Classifications / Types",
          content: classificationContent,
        });
      }
    }

    // Detailed sections (now after classifications)
    if (Array.isArray(lesson.sections)) {
      for (const section of lesson.sections) {
        if (section?.title && section?.content && section.title.trim() && section.content.trim()) {
          blocks.push({
            title: normalizeTitle(section.title.trim()),
            content: section.content.trim(),
          });
        }
      }
    }

    if (lesson.diagram && lesson.diagram.trim()) {
      blocks.push({
        title: "Diagram Description",
        content: lesson.diagram.trim(),
      });
    }
    
    const lines: string[] = [];
    for (const b of blocks) {
      if (b.title) lines.push(`${b.title}`);
      lines.push(b.content);
    }
    return lines.join("\n\n");
  }, [lesson]);

  const objectUrlsRef = useRef<string[]>([]);
  const fetchTTSBlobUrl = useCallback(async (text: string, isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      }
      
      // Check rate limit before making request
      const endpoint = '/api/tts';
      if (!rateLimiter.isAllowed(endpoint)) {
        const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
      }
      
      // Use the API base for TTS requests to ensure proper routing
      const res = await fetch(`/api/tts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        // Handle different error cases
        if (res.status === 503) {
          throw new Error('Audio service temporarily unavailable. Please try again later.');
        } else if (res.status === 400) {
          throw new Error('Invalid request to audio service.');
        } else {
          throw new Error(`Audio service error: ${res.status}`);
        }
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);
      return url;
    } catch (error) {
      console.error("TTS Error:", error);
      setTtsError(error instanceof Error ? error.message : "Failed to generate audio");
      return null;
    } finally {
      if (isRetry) {
        setIsRetrying(false);
      }
    }
  }, []);

  // Cleanup audio and revoke object URLs on unmount to prevent leaks
  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
        for (const u of objectUrlsRef.current) {
          try {
            URL.revokeObjectURL(u);
          } catch (e) {
            console.warn('Failed to revoke object URL:', e);
          }
        }
        objectUrlsRef.current = [];
      } catch (e) {
        console.error('Error during audio cleanup:', e);
      }
    };
  }, []);

  const segments = useMemo(() => {
    const segs: string[] = [];
    // Build segments directly from lesson structure for speed
    if (typeof lesson?.introduction === "string") {
      const intro = lesson.introduction.trim();
      segs.push(intro.length > 600 ? intro.slice(0, 600) : intro);
    }
    if (Array.isArray(lesson?.sections)) {
      for (const section of lesson.sections) {
        if (section?.content) {
          const c = String(section.content).trim();
          if (c) segs.push(c.length > 900 ? c.slice(0, 900) : c);
        }
      }
    }
    return segs.length ? segs : [getFullLessonText()];
  }, [lesson, getFullLessonText]);

  const preloadTTS = useCallback(async () => {
    try {
      setIsTtsLoading(true);
      setTtsError(null); // Clear previous errors
      if (!segments.length) return;
      const firstUrl = await fetchTTSBlobUrl(segments[0]);
      
      if (!firstUrl) {
        // If first attempt failed, try once more after a short delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryUrl = await fetchTTSBlobUrl(segments[0], true /* isRetry */);
        if (retryUrl) {
          setAudioUrl(retryUrl);
          setAudioQueue([retryUrl]);
          setCurrentIndex(0);
          // Continue with preloading...
        }
      }
      
      if (firstUrl) {
        setAudioUrl(firstUrl);
        setAudioQueue([firstUrl]);
        setCurrentIndex(0);
        // Preload the next segment in background if available
        if (segments.length > 1) {
          setIsQueuePreloading(true);
          fetchTTSBlobUrl(segments[1])
            .then((u) => {
              if (u) {
                setAudioQueue((q) => [...q, u]);
              }
            })
            .catch((error) => {
              console.error("Error preloading next segment:", error);
              setTtsError(error instanceof Error ? error.message : "Failed to preload audio");
            })
            .finally(() => setIsQueuePreloading(false));
        }
      }
    } catch (e) {
      console.error(e);
      setTtsError(e instanceof Error ? e.message : "Failed to generate audio");
    } finally {
      setIsTtsLoading(false);
    }
  }, [segments, fetchTTSBlobUrl]);

  const playTTS = useCallback(() => {
    const src = audioQueue[currentIndexRef.current] || audioUrl;
    if (!src) {
      console.warn("No audio source available to play");
      setTtsError("No audio available to play");
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.addEventListener("play", () => setIsPlaying(true));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current.addEventListener("ended", async () => {
        const prevIndex = currentIndexRef.current;
        const nextIndex = prevIndex + 1;
        if (segments[nextIndex] && !audioQueue[nextIndex]) {
          try {
            const u = await fetchTTSBlobUrl(segments[nextIndex]);
            if (!u) {
              // If first attempt failed, try once more
              await new Promise(resolve => setTimeout(resolve, 1000));
              const retryUrl = await fetchTTSBlobUrl(segments[nextIndex], true /* isRetry */);
              if (retryUrl) {
                setAudioQueue((q) => {
                  const qq = [...q];
                  qq[nextIndex] = retryUrl;
                  return qq;
                });
              }
            } else {
              setAudioQueue((q) => {
                const qq = [...q];
                qq[nextIndex] = u;
                return qq;
              });
            }
          } catch (e) {
            console.error(e);
            setTtsError(e instanceof Error ? e.message : "Failed to load next audio segment");
          }
        }
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        const nextSrc = audioQueue[nextIndex];
        if (nextSrc) {
          if (audioRef.current) {
            audioRef.current.src = nextSrc;
            audioRef.current.play().catch(console.error);
          }
        } else {
          setIsPlaying(false);
        }
      });
    } else {
      audioRef.current.src = src;
    }
    audioRef.current.play().catch(console.error);
  }, [audioUrl, audioQueue, segments, fetchTTSBlobUrl]);

  const togglePlayPause = useCallback(async () => {
    if (isTtsLoading || isQueuePreloading || isRetrying) return;
    const hasPrepared = !!(audioUrl || audioQueue.length);
    if (!audioRef.current) {
      if (!hasPrepared) {
        await preloadTTS();
      }
      playTTS();
      return;
    }
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [audioUrl, audioQueue, isTtsLoading, isQueuePreloading, isRetrying, preloadTTS, playTTS]);

  // Auto-preload audio once streaming completes to reduce wait time
  useEffect(() => {
    if (isStreamingComplete && !audioUrl && !isTtsLoading && !isRetrying) {
      preloadTTS();
    }
  }, [isStreamingComplete, audioUrl, isTtsLoading, isRetrying, preloadTTS]);

  // Create blocks for rendering
  const blocks = useMemo(() => {
    const result: { title?: string; content: string }[] = [];
    
    // Handle error responses differently
    if (isErrorResponse) {
      result.push({ 
        title: "Service Temporarily Unavailable", 
        content: lesson.introduction || "We're experiencing high demand. Please try again in a few minutes." 
      });
      
      // Add helpful suggestions
      if (lesson.sections && lesson.sections.length > 0) {
        result.push({ 
          title: lesson.sections[0].title || "Suggestions", 
          content: lesson.sections[0].content || "1. Try rephrasing your question\n2. Ask about a different topic\n3. Check back in a few minutes" 
        });
      }
    } else {
      if (lesson.introduction && typeof lesson.introduction === "string" && lesson.introduction.trim()) {
        result.push({
          title: "Introduction",
          content: lesson.introduction.trim(),
        });
      }

      if (
        Array.isArray(lesson.classifications) &&
        lesson.classifications.length > 0
      ) {
        const classificationContent = lesson.classifications
          .map((c: { type?: string; description?: string }) => {
            if (c?.type && c?.description) {
              return `• ${c.type}: ${c.description}`;
            }
            return null;
          })
          .filter(Boolean)
          .join("\n");

        if (classificationContent) {
          result.push({
            title: "Classifications / Types",
            content: classificationContent,
          });
        }
      }

      // Detailed sections (now after classifications)
      if (Array.isArray(lesson.sections)) {
        for (const section of lesson.sections) {
          if (section?.title && section?.content && section.title.trim() && section.content.trim()) {
            result.push({
              title: normalizeTitle(section.title.trim()),
              content: section.content.trim(),
            });
          }
        }
      }

      if (lesson.diagram && lesson.diagram.trim()) {
        result.push({
          title: "Diagram Description",
          content: lesson.diagram.trim(),
        });
      }
    }
    
    return result;
  }, [lesson, isErrorResponse, normalizeTitle]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 max-w-3xl mx-auto"
    >
      <div className={cn("rounded-xl p-6 border space-y-6", 
        isErrorResponse 
          ? "bg-red-500/10 border-red-500/20" 
          : "bg-white/5 backdrop-blur-sm border-white/10"
      )}>
        {blocks.map((block, idx) => (
          <div key={idx} className="space-y-2">
            {block.title && (
              <h3 className={cn("font-bold tracking-wide", 
                isErrorResponse ? "text-red-200 text-lg" : "text-white text-lg"
              )}>
                {block.title}
              </h3>
            )}
            <div className={cn("text-sm leading-relaxed whitespace-pre-wrap font-sans", 
              isErrorResponse ? "text-red-100/90" : "text-white/85"
            )}>
              {block.content.split("\n").map((line, i) => (
                <div key={i}>{sanitizeLine(line) || "\u00A0"}</div>
              ))}
            </div>
          </div>
        ))}

        {!blocks.length && (
          <p className="text-white/60 italic text-sm">No lesson content available.</p>
        )}
      </div>

      {/* Show error-specific message or normal controls */}
      {isErrorResponse ? (
        <div className="flex justify-end mt-6">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-white/10 text-white rounded-lg text-sm font-medium border border-white/20 hover:bg-white/20 transition-shadow flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </motion.button>
        </div>
      ) : (
        /* ➤ ONLY SHOW LISTEN + QUIZ AFTER STREAMING COMPLETES */
        isStreamingComplete && (
          <div className="flex justify-end mt-6 gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={togglePlayPause}
              disabled={isTtsLoading || isQueuePreloading || isRetrying}
              aria-pressed={isPlaying}
              className="px-5 py-2 bg-white/10 text-white rounded-lg text-sm font-medium border border-white/20 hover:bg-white/20 transition-shadow flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isTtsLoading || isQueuePreloading || isRetrying ? (
                <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {isTtsLoading || isQueuePreloading || isRetrying
                ? "Preparing audio…"
                : isPlaying
                ? "Pause"
                : audioUrl || audioQueue.length
                ? "Play"
                : "Prepare & Listen"}
            </motion.button>

            {lesson.quiz && lesson.quiz.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleTakeQuiz}
                className="px-5 py-2 bg-white text-black rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Take Quiz
              </motion.button>
            )}
          </div>
        )
      )}
    </motion.div>
  );
};