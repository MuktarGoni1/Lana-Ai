import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: attempts, error: attemptsError } = await supabase
      .from("exam_attempts")
      .select("id, topic_key, question_count, correct_count, score_percent, started_at, completed_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20);

    if (attemptsError) {
      return NextResponse.json({ error: attemptsError.message }, { status: 500 });
    }

    const rows = attempts ?? [];
    const completed = rows.filter((row) => row.completed_at);
    const totalAttempts = rows.length;
    const completedAttempts = completed.length;
    const bestScore = completed.length ? Math.max(...completed.map((row) => Number(row.score_percent || 0))) : 0;
    const averageScore = completed.length
      ? Math.round(
          completed.reduce((sum, row) => sum + Number(row.score_percent || 0), 0) / Math.max(1, completed.length)
        )
      : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            total_attempts: totalAttempts,
            completed_attempts: completedAttempts,
            average_score_percent: averageScore,
            best_score_percent: bestScore,
          },
          attempts: rows,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[exam-prep/history] error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
