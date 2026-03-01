"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/db";
import AppTopbar from "@/components/layout/app-topbar";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

type TopicMeta = {
  id: string;
  title: string;
  subject_name: string;
  status: string;
};

type LessonSection = {
  title: string;
  content: string;
};

type LessonPayload = {
  introduction?: string;
  sections?: LessonSection[];
  summary?: string;
  quiz?: QuizQuestion[];
};

type QuizQuestion = {
  q: string;
  options: string[];
  answer: string;
  explanation?: string;
};

function normalizeQuizForClient(input: unknown): QuizQuestion[] {
  if (!Array.isArray(input)) return [];

  function resolveAnswer(answerRaw: string, options: string[]): string | null {
    const answer = answerRaw.trim();
    if (!answer || options.length === 0) return null;
    if (options.includes(answer)) return answer;

    const ci = options.find((opt) => opt.toLowerCase() === answer.toLowerCase());
    if (ci) return ci;

    if (/^[A-Za-z]$/.test(answer)) {
      const idx = answer.toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < options.length) return options[idx];
      return null;
    }

    if (/^\d+$/.test(answer)) {
      const n = Number.parseInt(answer, 10);
      if (Number.isNaN(n)) return null;
      if (n >= 1 && n <= options.length) return options[n - 1];
      if (n >= 0 && n < options.length) return options[n];
    }

    return null;
  }

  const out: QuizQuestion[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const q = (typeof item.q === "string" ? item.q : typeof item.question === "string" ? item.question : "").trim();
    const rawOptions = Array.isArray(item.options) ? item.options : Array.isArray(item.choices) ? item.choices : [];
    const options = rawOptions
      .filter((opt): opt is string => typeof opt === "string")
      .map((opt) => opt.trim())
      .filter(Boolean);
    const rawAnswer = (typeof item.answer === "string" ? item.answer : typeof item.correct === "string" ? item.correct : "").trim();
    const answer = resolveAnswer(rawAnswer, options);
    const explanation = typeof item.explanation === "string" ? item.explanation : undefined;

    if (!q || options.length < 2 || !answer) continue;
    out.push({ q, options, answer, explanation });
  }
  return out;
}

function isDoneStatus(status: string | undefined) {
  if (!status) return false;
  return ["completed", "done", "succeeded", "success"].includes(status.toLowerCase());
}

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isOnboardingComplete } = useUnifiedAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState<TopicMeta | null>(null);
  const [lesson, setLesson] = useState<LessonPayload | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [generationBusy, setGenerationBusy] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);

  const passScore = useMemo(() => {
    const total = quiz.length;
    if (!total) return 0;
    return Math.ceil(total * 0.7);
  }, [quiz.length]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!authLoading && isAuthenticated && !isOnboardingComplete()) {
      router.replace("/onboarding");
    }
  }, [authLoading, isAuthenticated, isOnboardingComplete, router]);

  useEffect(() => {
    const load = async () => {
      const topicId = params?.id;
      if (!topicId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setGenerationError(null);
      setGenerationBusy(false);
      setGenerationJobId(null);
      setGenerationStartedAt(null);

      try {
        const db = supabase as any;
        const { data: topicData } = await db
          .from("topics")
          .select("id, title, subject_name, status")
          .eq("id", topicId)
          .maybeSingle();
        setTopic(topicData ?? null);

        await loadOrGenerateLesson(topicId);
      } catch (err: any) {
        setError(err?.message || "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params?.id]);

  async function loadOrGenerateLesson(topicId: string) {
    const unitRes = await fetch(`/api/lesson/${topicId}`, { cache: "no-store" });

    if (unitRes.ok) {
      const unitPayload = await unitRes.json();
      const quality = unitPayload?.meta?.quality_status;

      if (quality === "invalid") {
        await beginGeneration(topicId, true);
        return;
      }

      const lessonContent = (unitPayload?.data?.lesson_content || {}) as LessonPayload;
      const normalizedQuiz = normalizeQuizForClient(lessonContent.quiz);
      setLesson(lessonContent);
      setQuiz(normalizedQuiz);
      setVideoUrl(unitPayload?.data?.video_url || null);

      if (normalizedQuiz.length === 0) {
        const fetchQuizRes = await fetch(`/api/quiz/${topicId}`, { cache: "no-store" });
        if (fetchQuizRes.ok) {
          const q = await fetchQuizRes.json();
          if (Array.isArray(q)) setQuiz(normalizeQuizForClient(q));
        }
      }
      return;
    }

    if (unitRes.status === 404) {
      const missingPayload = await unitRes.json().catch(() => ({}));
      const generationStatus = missingPayload?.meta?.generation_status;
      const existingJobId = missingPayload?.meta?.job?.id as string | undefined;

      if (generationStatus === "processing" && existingJobId) {
        setGenerationBusy(true);
        setGenerationError(null);
        setGenerationJobId(existingJobId);
        setGenerationStartedAt(Date.now());
        return;
      }

      await beginGeneration(topicId, false);
      return;
    }

    const body = await unitRes.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to load lesson");
  }

  async function beginGeneration(topicId: string, forceRefresh: boolean) {
    setGenerationBusy(true);
    setGenerationError(null);
    setGenerationStartedAt(Date.now());

    const startRes = await fetch("/api/lesson/generate-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, forceRefresh }),
    });

    if (!startRes.ok) {
      const body = await startRes.json().catch(() => ({}));
      throw new Error(body?.error || "Failed to start lesson generation");
    }

    const startPayload = await startRes.json();
    const jobId = startPayload?.data?.jobId as string | undefined;
    if (!jobId) {
      throw new Error("Generation job was created without a job id");
    }

    setGenerationJobId(jobId);
  }

  useEffect(() => {
    if (!videoJobId) return;

    let stopped = false;
    const interval = setInterval(async () => {
      if (stopped) return;
      try {
        const res = await fetch(`/api/video/status/${videoJobId}`, { cache: "no-store" });
        if (!res.ok) return;

        const payload = await res.json();
        const status = payload?.status || payload?.data?.status || payload?.job?.status;
        if (!isDoneStatus(status)) return;

        const resolvedUrl =
          payload?.video_url ||
          payload?.url ||
          payload?.download_url ||
          payload?.data?.video_url ||
          payload?.data?.url ||
          `/api/video/download/${videoJobId}`;

        setVideoUrl(resolvedUrl);
        setVideoBusy(false);
        setVideoJobId(null);

        await fetch(`/api/lesson/${params.id}/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: resolvedUrl }),
        });
      } catch {
      }
    }, 5000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [videoJobId, params.id]);

  useEffect(() => {
    if (!generationJobId || !params?.id) return;

    let stopped = false;
    const interval = setInterval(async () => {
      if (stopped) return;
      try {
        const statusRes = await fetch(`/api/lesson/generate-job/${generationJobId}`, { cache: "no-store" });
        if (!statusRes.ok) return;

        const statusPayload = await statusRes.json();
        const status = statusPayload?.data?.status;

        if (status === "queued" || status === "processing") {
          setGenerationBusy(true);
          return;
        }

        if (status === "failed") {
          setGenerationBusy(false);
          setGenerationError(statusPayload?.data?.errorMessage || "Lesson generation failed.");
          setGenerationJobId(null);
          setGenerationStartedAt(null);
          return;
        }

        if (status === "completed") {
          await loadOrGenerateLesson(params.id);
          setGenerationBusy(false);
          setGenerationError(null);
          setGenerationJobId(null);
          setGenerationStartedAt(null);
        }
      } catch {
      }
    }, 2000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [generationJobId, params?.id]);

  async function fallbackGenerateLesson(topicId: string) {
    const lessonRes = await fetch("/api/lesson/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, forceRefresh: true }),
    });

    if (!lessonRes.ok) {
      const body = await lessonRes.json().catch(() => ({}));
      throw new Error(body?.error || "Fallback lesson generation failed.");
    }

    const quizRes = await fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, forceRefresh: true }),
    });

    if (!quizRes.ok) {
      console.warn("[lesson-page] Quiz fallback generation failed", quizRes.status);
    }

    await loadOrGenerateLesson(topicId);
    setGenerationBusy(false);
    setGenerationError(null);
    setGenerationJobId(null);
    setGenerationStartedAt(null);
  }

  useEffect(() => {
    if (!generationBusy || !generationJobId || !params?.id || !generationStartedAt) return;

    const timeout = setTimeout(async () => {
      try {
        await fallbackGenerateLesson(params.id);
      } catch (err: any) {
        setGenerationBusy(false);
        setGenerationJobId(null);
        setGenerationStartedAt(null);
        setGenerationError(err?.message || "Lesson generation timed out. Please retry.");
      }
    }, 45000);

    return () => clearTimeout(timeout);
  }, [generationBusy, generationJobId, generationStartedAt, params?.id]);

  async function retryGeneration() {
    if (!params?.id) return;
    setGenerationError(null);
    setGenerationBusy(true);
    setGenerationStartedAt(Date.now());

    const res = await fetch(`/api/lesson/${params.id}/regenerate`, {
      method: "POST",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setGenerationBusy(false);
      setGenerationError(body?.error || "Retry failed.");
      return;
    }

    const payload = await res.json();
    const nextJobId = payload?.data?.jobId as string | undefined;
    if (!nextJobId) {
      setGenerationBusy(false);
      setGenerationError("Retry started without a valid job id.");
      return;
    }

    setGenerationJobId(nextJobId);
  }

  async function submitQuiz() {
    if (!params?.id || quiz.length === 0) return;

    const score = quiz.reduce((acc, q, idx) => (answers[idx] === q.answer ? acc + 1 : acc), 0);

    const res = await fetch("/api/quiz/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: params.id,
        score,
        total: quiz.length,
        answers,
      }),
    });

    if (!res.ok) {
      return;
    }

    setQuizSubmitted(true);
    setQuizScore(score);

    if (score >= passScore) {
      await fetch("/api/topic/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: params.id }),
      });
    }
  }

  async function generateExplainerVideo() {
    if (!topic?.title || videoBusy || videoJobId) return;
    setVideoBusy(true);

    try {
      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.title,
          style: "explainer",
          maxDuration: 180,
        }),
      });

      if (!res.ok) {
        setVideoBusy(false);
        return;
      }

      const payload = await res.json();
      const jobId = payload?.job_id || payload?.jobId || payload?.id;
      if (!jobId) {
        setVideoBusy(false);
        return;
      }

      setVideoJobId(String(jobId));
    } catch {
      setVideoBusy(false);
    }
  }


  useEffect(() => {
    if (!lesson) return;
    if (videoUrl || videoBusy || videoJobId) return;

    void generateExplainerVideo();
  }, [lesson, videoBusy, videoJobId, videoUrl]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
      </div>
    );
  }

  if (generationBusy) {
    return (
      <div className="grid min-h-screen place-items-center bg-black text-white">
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-white/70" />
          <p className="text-sm text-white/70">Generating your lesson and quiz...</p>
          <p className="text-xs text-white/45">If this takes too long, we automatically switch to a fallback generator.</p>
        </div>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="min-h-screen bg-black px-5 py-8 text-white">
        <button onClick={() => router.push("/lessons")} className="mb-4 rounded-md border border-white/20 px-3 py-2 text-xs">
          Back to lessons
        </button>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p>{generationError}</p>
          <button
            onClick={retryGeneration}
            className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"
          >
            Retry generation
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black px-5 py-8 text-white">
        <button onClick={() => router.push("/lessons")} className="mb-4 rounded-md border border-white/20 px-3 py-2 text-xs">
          Back to lessons
        </button>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{error}</div>
      </div>
    );
  }

  const intro = lesson?.introduction || "";
  const sections = Array.isArray(lesson?.sections) ? lesson!.sections : [];

  return (
    <div className="min-h-screen bg-black text-white">
      <AppTopbar
        title={topic?.title || "Lesson"}
        subtitle={topic?.subject_name || "Subject"}
        showBack
        backLabel="Lessons"
        onBack={() => router.push("/lessons")}
      />

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-5 sm:px-5 sm:py-6">
                <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold">Lesson content</h2>
            {intro && (
              <div>
                <h2 className="mb-1 text-sm font-semibold text-white/80">Introduction</h2>
                <p className="text-sm text-white/90">{intro}</p>
              </div>
            )}

            {sections.map((section, idx) => (
              <div key={`${section.title}-${idx}`}>
                <h3 className="mb-1 text-sm font-semibold">{section.title}</h3>
                <p className="text-sm text-white/85">{section.content}</p>
              </div>
            ))}

            {lesson?.summary && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <h3 className="mb-1 text-sm font-semibold">Summary</h3>
                <p className="text-sm text-white/85">{lesson.summary}</p>
              </div>
            )}

          </section>

                <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold">Quiz</h2>
            {quiz.length === 0 ? (
              <p className="text-sm text-white/70">No quiz questions available for this lesson yet.</p>
            ) : (
              <>
                {quiz.map((q, idx) => (
                  <div key={`${q.q}-${idx}`} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-sm font-medium">
                      {idx + 1}. {q.q}
                    </p>
                    <div className="space-y-1">
                      {q.options.map((option) => (
                        <label key={option} className="flex min-h-8 cursor-pointer items-center gap-2 text-sm text-white/90">
                          <input
                            type="radio"
                            name={`q-${idx}`}
                            checked={answers[idx] === option}
                            onChange={() => setAnswers((prev) => ({ ...prev, [idx]: option }))}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={submitQuiz}
                  className="min-h-10 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"
                  disabled={Object.keys(answers).length < quiz.length}
                >
                  Submit quiz
                </button>

                {quizSubmitted && quizScore !== null && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                    <p>
                      Score: {quizScore}/{quiz.length} (pass mark: {passScore})
                    </p>
                    {quizScore >= passScore ? (
                      <p className="mt-1 flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Topic marked as completed.
                      </p>
                    ) : (
                      <p className="mt-1 text-amber-300">Review the lesson and try again.</p>
                    )}
                  </div>
                )}

              </>
            )}
          </section>

        <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Explainer video</h2>
              <button
                onClick={generateExplainerVideo}
                disabled={videoBusy || Boolean(videoJobId)}
                className="inline-flex min-h-10 items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
              >
                {videoBusy || videoJobId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                {videoBusy || videoJobId ? "Generating..." : videoUrl ? "Regenerate video" : "Generate video"}
              </button>
            </div>

            {videoUrl ? (
              <video src={videoUrl} controls autoPlay muted className="w-full rounded-lg border border-white/10 bg-black" />
            ) : videoBusy || videoJobId ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating your explainer video…</span>
                </div>
                <p className="mt-2 text-xs text-white/60">Lesson and quiz are ready while your video is being prepared.</p>
              </div>
            ) : (
              <p className="text-sm text-white/70">No video generated yet for this lesson.</p>
            )}
          </section>
      </main>
    </div>
  );
}
