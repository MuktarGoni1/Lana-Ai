"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/db";
import AppTopbar from "@/components/layout/app-topbar";

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

function isDoneStatus(status: string | undefined) {
  if (!status) return false;
  return ["completed", "done", "succeeded", "success"].includes(status.toLowerCase());
}

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState<TopicMeta | null>(null);
  const [lesson, setLesson] = useState<LessonPayload | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const [activeStep, setActiveStep] = useState<"lesson" | "quiz" | "video">("lesson");

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);

  const passScore = useMemo(() => {
    const total = quiz.length;
    if (!total) return 0;
    return Math.ceil(total * 0.7);
  }, [quiz.length]);

  useEffect(() => {
    const load = async () => {
      const topicId = params?.id;
      if (!topicId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const db = supabase as any;
        const { data: topicData } = await db
          .from("topics")
          .select("id, title, subject_name, status")
          .eq("id", topicId)
          .maybeSingle();
        setTopic(topicData ?? null);

        let unitRes = await fetch(`/api/lesson/${topicId}`, { cache: "no-store" });
        if (unitRes.status === 404) {
          const generateRes = await fetch("/api/lesson/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topicId }),
          });

          if (!generateRes.ok) {
            const body = await generateRes.json().catch(() => ({}));
            throw new Error(body?.error || "Failed to generate lesson");
          }

          unitRes = await fetch(`/api/lesson/${topicId}`, { cache: "no-store" });
        }

        if (!unitRes.ok) {
          const body = await unitRes.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to load lesson");
        }

        const unitPayload = await unitRes.json();
        const lessonContent = (unitPayload?.data?.lesson_content || {}) as LessonPayload;

        setLesson(lessonContent);
        setQuiz(Array.isArray(lessonContent.quiz) ? lessonContent.quiz : []);
        setVideoUrl(unitPayload?.data?.video_url || null);

        if (!Array.isArray(lessonContent.quiz) || lessonContent.quiz.length === 0) {
          const quizRes = await fetch("/api/quiz/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topicId }),
          });

          if (quizRes.ok) {
            const fetchQuizRes = await fetch(`/api/quiz/${topicId}`, { cache: "no-store" });
            if (fetchQuizRes.ok) {
              const q = await fetchQuizRes.json();
              if (Array.isArray(q)) setQuiz(q);
            }
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params?.id]);

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
    if (!topic?.title || videoBusy) return;
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

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
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
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
          {[
            { id: "lesson", label: "Lesson" },
            { id: "quiz", label: "Quiz" },
            { id: "video", label: "Explainer Video" },
          ].map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id as "lesson" | "quiz" | "video")}
              className={`min-h-10 rounded-lg px-3 py-2 text-xs sm:text-sm ${activeStep === step.id ? "bg-white text-black" : "text-white/70"}`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {activeStep === "lesson" && (
          <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
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

            <button onClick={() => setActiveStep("quiz")} className="min-h-10 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black">
              Continue to quiz
            </button>
          </section>
        )}

        {activeStep === "quiz" && (
          <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
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

                <button onClick={() => setActiveStep("video")} className="min-h-10 rounded-md border border-white/20 px-3 py-2 text-xs">
                  Continue to explainer video
                </button>
              </>
            )}
          </section>
        )}

        {activeStep === "video" && (
          <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Generated explainer video</h2>
              <button
                onClick={generateExplainerVideo}
                disabled={videoBusy}
                className="inline-flex min-h-10 items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
              >
                {videoBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                {videoBusy ? "Generating..." : videoUrl ? "Regenerate video" : "Generate video"}
              </button>
            </div>

            {videoUrl ? (
              <video src={videoUrl} controls className="w-full rounded-lg border border-white/10 bg-black" />
            ) : (
              <p className="text-sm text-white/70">No video generated yet for this lesson.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
