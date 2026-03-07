import { NextResponse } from "next/server";
import { z } from "zod";
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

    const { data: attempt, error: attemptError } = await supabase
      .from("exam_attempts")
      .select("id, completed_at, question_snapshot")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (attemptError) {
      return NextResponse.json({ error: attemptError.message }, { status: 500 });
    }

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.completed_at) {
      return NextResponse.json({ error: "Attempt already submitted" }, { status: 409 });
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

    const { error: updateError } = await supabase
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
  } catch (error: any) {
    console.error("[exam-prep/attempt/:attemptId/submit] error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
