import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createServerClient } from "@/lib/supabase/server";

function resolveStructuredLessonEndpoint(): string {
  const backendBase = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");
  return `${backendBase}/api/structured-lesson`;
}

function deriveTopic(payload: { title?: string; subject?: string; topic_id?: string }): string {
  const candidate = (payload.title || payload.subject || payload.topic_id || "").trim();
  return candidate;
}

function deriveAge(grade?: string): number | undefined {
  if (!grade) return undefined;
  const value = grade.trim().toLowerCase();
  if (value === "college") return 19;
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num)) return undefined;
  if (num >= 1 && num <= 5) return 7;
  if (num <= 8) return 11;
  if (num <= 10) return 14;
  if (num <= 12) return 17;
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const body = await req.json().catch(() => ({}));
    const { topic_id, user_id, subject, title, grade } = body as {
      topic_id: string;
      user_id: string;
      subject?: string;
      title?: string;
      grade?: string;
    };

    if (!topic_id) {
      return NextResponse.json({ error: "topic_id is required" }, { status: 400 });
    }

    if (user_id && user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const effectiveUserId = user.id;

    const { data: topicRow, error: topicError } = await supabaseAdmin
      .from("topics")
      .select("id, user_id, title, subject_name")
      .eq("id", topic_id)
      .eq("user_id", effectiveUserId)
      .maybeSingle();

    if (topicError) {
      return NextResponse.json({ error: topicError.message }, { status: 500 });
    }

    if (!topicRow) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const { data: cached } = await supabaseAdmin
      .from("lesson_units")
      .select("lesson_content, is_ready")
      .eq("topic_id", topic_id)
      .maybeSingle();

    if (cached?.is_ready && cached?.lesson_content) {
      const { data: cachedQuiz } = await supabaseAdmin
        .from("quiz_questions")
        .select("questions")
        .eq("topic_id", topic_id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      await updateLessonGenerationJob(supabaseAdmin, topic_id, effectiveUserId, {
        status: "completed",
        updated_at: new Date().toISOString(),
        error_code: null,
        error_message: null,
      });

      return NextResponse.json({
        status: "completed",
        lesson_content: cached.lesson_content,
        questions: cachedQuiz?.questions ?? [],
      });
    }

    await supabaseAdmin.from("lesson_generation_jobs").upsert(
      {
        user_id: effectiveUserId,
        topic_id,
        status: "processing",
        updated_at: new Date().toISOString(),
        error_code: null,
        error_message: null,
      },
      { onConflict: "topic_id,user_id" }
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);

    let lessonContent: Record<string, unknown> | null = null;
    let questions: unknown[] = [];

    try {
      const structuredLessonEndpoint = resolveStructuredLessonEndpoint();
      const backendRes = await fetch(structuredLessonEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: deriveTopic({
            title: title ?? topicRow.title ?? "",
            subject: subject ?? topicRow.subject_name ?? "",
            topic_id,
          }),
          age: deriveAge(grade),
          generate_video: false,
          skip_video: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!backendRes.ok) {
        const errText = await backendRes.text().catch(() => "no body");
        throw new Error(`Backend ${backendRes.status}: ${errText}`);
      }

      const contentType = backendRes.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream")) {
        const payload = await drainSSE(backendRes);
        lessonContent = extractLesson(payload);
        questions = extractQuestions(payload);
      } else {
        const json = await backendRes.json();
        lessonContent = extractLesson(json);
        questions = extractQuestions(json);
      }
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);

      await updateLessonGenerationJob(supabaseAdmin, topic_id, effectiveUserId, {
        status: "failed",
        updated_at: new Date().toISOString(),
        error_code: "BACKEND_REQUEST_FAILED",
        error_message: msg,
      });

      return NextResponse.json({ error: "Lesson generation failed", details: msg }, { status: 502 });
    }

    if (!lessonContent) {
      await updateLessonGenerationJob(supabaseAdmin, topic_id, effectiveUserId, {
        status: "failed",
        updated_at: new Date().toISOString(),
        error_code: "EMPTY_LESSON",
        error_message: "Empty lesson returned from structured-lesson endpoint",
      });

      return NextResponse.json({ error: "Backend returned empty lesson" }, { status: 502 });
    }

    const now = new Date().toISOString();

    if (cached) {
      await supabaseAdmin
        .from("lesson_units")
        .update({
          lesson_content: lessonContent,
          is_ready: true,
          generated_at: now,
          refreshed_at: now,
        })
        .eq("topic_id", topic_id);
    } else {
      await supabaseAdmin.from("lesson_units").insert({
        topic_id,
        lesson_content: lessonContent,
        is_ready: true,
        generated_at: now,
      });
    }

    if (questions.length > 0) {
      const { data: existingQuiz } = await supabaseAdmin
        .from("quiz_questions")
        .select("id")
        .eq("topic_id", topic_id)
        .maybeSingle();

      if (existingQuiz) {
        await supabaseAdmin
          .from("quiz_questions")
          .update({ questions, generated_at: now })
          .eq("topic_id", topic_id);
      } else {
        await supabaseAdmin.from("quiz_questions").insert({
          topic_id,
          questions,
          generated_at: now,
        });
      }
    }

    await updateLessonGenerationJob(supabaseAdmin, topic_id, effectiveUserId, {
      status: "completed",
      updated_at: now,
      error_code: null,
      error_message: null,
    });

    return NextResponse.json({
      status: "completed",
      lesson_content: lessonContent,
      questions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[structured-lesson/stream] Fatal error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function updateLessonGenerationJob(
  supabaseAdmin: any,
  topicId: string,
  userId: string,
  payload: {
    status: "processing" | "completed" | "failed";
    updated_at: string;
    error_code?: string | null;
    error_message?: string | null;
  }
) {
  const { error } = await supabaseAdmin
    .from("lesson_generation_jobs")
    .update(payload)
    .eq("topic_id", topicId)
    .eq("user_id", userId);

  // Backward compatibility for legacy schema using a single `error` column.
  if (!error) return;
  if (!error.message?.toLowerCase().includes("column")) return;

  const legacyPayload: Record<string, unknown> = {
    status: payload.status,
    updated_at: payload.updated_at,
  };

  if (payload.status === "failed") {
    legacyPayload.error = payload.error_message ?? payload.error_code ?? "Lesson generation failed";
  } else {
    legacyPayload.error = null;
  }

  await supabaseAdmin
    .from("lesson_generation_jobs")
    .update(legacyPayload)
    .eq("topic_id", topicId)
    .eq("user_id", userId);
}

async function drainSSE(res: Response): Promise<Record<string, unknown>> {
  const reader = res.body?.getReader();
  if (!reader) return {};

  const decoder = new TextDecoder();
  let buffer = "";
  let result: Record<string, unknown> = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;

        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          Object.assign(result, parsed);
          if (hasLessonPayload(parsed) || parsed.type === "error") {
            break;
          }
        } catch {
          // Ignore malformed chunk.
        }
      }

      if (hasLessonPayload(result) || result.type === "error") {
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}

function hasLessonPayload(raw: Record<string, unknown> | null): boolean {
  if (!raw) return false;
  if (raw.lesson_content || raw.lesson || raw.content) return true;
  if (raw.payload && typeof raw.payload === "object") {
    const payload = raw.payload as Record<string, unknown>;
    if (payload.lesson_content || payload.lesson || payload.content) return true;
  }
  const hasIntro = typeof raw.introduction === "string" && raw.introduction.trim().length > 0;
  const hasSections = Array.isArray(raw.sections) && raw.sections.length > 0;
  return hasIntro && hasSections;
}

function extractLesson(raw: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!raw) return null;

  const fromPayload = raw.payload;
  if (fromPayload && typeof fromPayload === "object") {
    const payload = fromPayload as Record<string, unknown>;
    return (payload.lesson_content ?? payload.lesson ?? payload.content ?? null) as
      | Record<string, unknown>
      | null;
  }

  // Accept direct backend StructuredLessonResponse shape:
  // { introduction, sections, classifications?, diagram?, quiz? }
  const hasIntro = typeof raw.introduction === "string" && raw.introduction.trim().length > 0;
  const hasSections = Array.isArray(raw.sections) && raw.sections.length > 0;
  if (hasIntro && hasSections) {
    return raw;
  }

  return (raw.lesson_content ?? raw.lesson ?? raw.content ?? (raw.summary ? raw : null)) as
    | Record<string, unknown>
    | null;
}

function extractQuestions(raw: Record<string, unknown> | null): unknown[] {
  if (!raw) return [];

  const fromPayload = raw.payload;
  if (fromPayload && typeof fromPayload === "object") {
    const payload = fromPayload as Record<string, unknown>;
    const payloadQuestions = payload.questions ?? payload.quiz_questions ?? payload.quiz ?? [];
    return Array.isArray(payloadQuestions) ? payloadQuestions : [];
  }

  const questions = raw.questions ?? raw.quiz_questions ?? raw.quiz ?? [];
  return Array.isArray(questions) ? questions : [];
}
