import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ attemptId: string }> }) {
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

    const { data: attempt, error: attemptError } = await supabase
      .from("exam_attempts")
      .select(
        "id, topic_key, source_topic_id, question_count, correct_count, score_percent, question_snapshot, answers, started_at, completed_at"
      )
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (attemptError) {
      return NextResponse.json({ error: attemptError.message }, { status: 500 });
    }

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: attempt }, { status: 200 });
  } catch (error: any) {
    console.error("[exam-prep/attempt/:attemptId GET] error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
