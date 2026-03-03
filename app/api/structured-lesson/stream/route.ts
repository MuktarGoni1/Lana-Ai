import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const body = await req.json().catch(() => ({}));
    const { topic_id, user_id, subject, title, grade } = body as {
      topic_id: string;
      user_id: string;
      subject?: string;
      title?: string;
      grade?: string;
    };

    if (!topic_id || !user_id) {
      return NextResponse.json({ error: "topic_id and user_id are required" }, { status: 400 });
    }

    const { data: cached } = await supabaseAdmin
      .from("lesson_units")
      .select("lesson_content, is_ready, video_url, audio_url")
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

      await supabaseAdmin
        .from("lesson_generation_jobs")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("topic_id", topic_id)
        .eq("user_id", user_id);

      return NextResponse.json({
        status: "completed",
        lesson_content: cached.lesson_content,
        questions: cachedQuiz?.questions ?? [],
        video_url: cached.video_url ?? null,
        audio_url: cached.audio_url ?? null,
      });
    }

    await supabaseAdmin.from("lesson_generation_jobs").upsert(
      {
        user_id,
        topic_id,
        status: "processing",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "topic_id,user_id" }
    );

    const apiBase = (process.env.NEXT_PUBLIC_API_BASE ?? "https://api.lanamind.com").replace(/\/$/, "");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);

    let lessonContent: Record<string, unknown> | null = null;
    let questions: unknown[] = [];

    try {
      const backendRes = await fetch(`${apiBase}/api/structured-lesson`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id,
          user_id,
          subject: subject ?? "",
          title: title ?? "",
          grade: grade ?? "",
          generate_video: false,
          generate_audio: false,
          skip_video: true,
          skip_audio: true,
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

      await supabaseAdmin
        .from("lesson_generation_jobs")
        .update({ status: "failed", error: msg, updated_at: new Date().toISOString() })
        .eq("topic_id", topic_id)
        .eq("user_id", user_id);

      return NextResponse.json({ error: "Lesson generation failed", details: msg }, { status: 502 });
    }

    if (!lessonContent) {
      await supabaseAdmin
        .from("lesson_generation_jobs")
        .update({ status: "failed", error: "Empty lesson returned", updated_at: new Date().toISOString() })
        .eq("topic_id", topic_id)
        .eq("user_id", user_id);

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

    await supabaseAdmin
      .from("lesson_generation_jobs")
      .update({ status: "completed", updated_at: now })
      .eq("topic_id", topic_id)
      .eq("user_id", user_id);

    return NextResponse.json({
      status: "completed",
      lesson_content: lessonContent,
      questions,
      video_url: null,
      audio_url: null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[structured-lesson/stream] Fatal error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
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
          if (parsed.type === "done" || parsed.lesson_content || parsed.lesson) {
            break;
          }
        } catch {
          // Ignore malformed chunk.
        }
      }

      if (result.type === "done" || result.lesson_content || result.lesson) {
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}

function extractLesson(raw: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!raw) return null;

  return (raw.lesson_content ?? raw.lesson ?? raw.content ?? (raw.summary ? raw : null)) as
    | Record<string, unknown>
    | null;
}

function extractQuestions(raw: Record<string, unknown> | null): unknown[] {
  if (!raw) return [];
  const questions = raw.questions ?? raw.quiz_questions ?? raw.quiz ?? [];
  return Array.isArray(questions) ? questions : [];
}
