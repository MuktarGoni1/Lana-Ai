import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
      return NextResponse.json({ error: "Invalid attempt id" }, { status: 400 });
    }

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
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (serviceRoleKey && supabaseUrl) {
        const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
        const { data: rawAttempt, error: rawAttemptError } = await admin
          .from("exam_attempts")
          .select(
            "id, user_id, topic_key, source_topic_id, question_count, correct_count, score_percent, question_snapshot, answers, started_at, completed_at"
          )
          .eq("id", attemptId)
          .maybeSingle();

        if (!rawAttemptError && rawAttempt && rawAttempt.user_id === user.id) {
          const { user_id: _ignored, ...safeAttempt } = rawAttempt;
          return NextResponse.json({ success: true, data: safeAttempt }, { status: 200 });
        }
      }

      return NextResponse.json({ error: "Attempt not found", code: "ATTEMPT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: attempt }, { status: 200 });
  } catch (error: any) {
    console.error("[exam-prep/attempt/:attemptId GET] error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
