import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { gradeExamAttempt, normalizeExamQuestion, type ExamQuestion } from "@/lib/exam-prep";

const SubmitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function POST(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = SubmitSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    let { data: attempt, error: attemptError } = await supabase
      .from("exam_attempts")
      .select("id, question_count, correct_count, score_percent, completed_at, question_snapshot, answers")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (attemptError) {
      return NextResponse.json({ error: attemptError.message }, { status: 500 });
    }

    if (!attempt) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (serviceRoleKey && supabaseUrl) {
        const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
        const { data: rawAttempt, error: rawAttemptError } = await admin
          .from("exam_attempts")
          .select("id, user_id, question_count, correct_count, score_percent, completed_at, question_snapshot, answers")
          .eq("id", attemptId)
          .maybeSingle();

        if (!rawAttemptError && rawAttempt && rawAttempt.user_id === user.id) {
          const { user_id: _ignored, ...safeAttempt } = rawAttempt;
          attempt = safeAttempt;
        }
      }
    }

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found", code: "ATTEMPT_NOT_FOUND" }, { status: 404 });
    }

    if (attempt.completed_at) {
      const total = Number(attempt.question_count || 0);
      const correct = Number(attempt.correct_count || 0);
      const scorePercent = Number(attempt.score_percent || 0);
      const maybeReview =
        attempt.answers && typeof attempt.answers === "object" && Array.isArray((attempt.answers as Record<string, unknown>).review)
          ? ((attempt.answers as Record<string, unknown>).review as unknown[])
          : [];

      return NextResponse.json(
        {
          success: true,
          data: {
            attemptId: attempt.id,
            completedAt: attempt.completed_at,
            total,
            correct,
            wrong: Math.max(0, total - correct),
            scorePercent,
            review: maybeReview,
            alreadySubmitted: true,
          },
        },
        { status: 200 }
      );
    }

    const rawQuestions = Array.isArray(attempt.question_snapshot) ? attempt.question_snapshot : [];
    const questions = rawQuestions
      .map((question) => normalizeExamQuestion(question))
      .filter((question): question is ExamQuestion => Boolean(question));

    if (!questions.length) {
      return NextResponse.json({ error: "Attempt has no valid questions" }, { status: 422 });
    }

    const grade = gradeExamAttempt(questions, parsed.data.answers);
    const finishedAt = new Date().toISOString();

    let { error: updateError } = await supabase
      .from("exam_attempts")
      .update({
        answers: {
          review: grade.review,
          submitted_answers: parsed.data.answers,
        },
        correct_count: grade.correct,
        score_percent: grade.score_percent,
        completed_at: finishedAt,
      })
      .eq("id", attempt.id)
      .eq("user_id", user.id);

    if (updateError) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (serviceRoleKey && supabaseUrl) {
        const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
        const { error: adminUpdateError } = await admin
          .from("exam_attempts")
          .update({
            answers: {
              review: grade.review,
              submitted_answers: parsed.data.answers,
            },
            correct_count: grade.correct,
            score_percent: grade.score_percent,
            completed_at: finishedAt,
          })
          .eq("id", attempt.id)
          .eq("user_id", user.id);

        updateError = adminUpdateError;
      }
    }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          attemptId: attempt.id,
          completedAt: finishedAt,
          total: grade.total,
          correct: grade.correct,
          wrong: grade.wrong,
          scorePercent: grade.score_percent,
          review: grade.review,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[exam-prep/attempt/:attemptId/submit] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
