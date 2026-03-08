import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import {
  type ExamOption,
  type ExamQuestion,
  normalizeExamQuestion,
  normalizeTopicKey,
  shuffleArray,
} from "@/lib/exam-prep";
import { generateEmergencyExamQuestions, generateExamQuestions } from "@/lib/exam-prep-generation";

const StartSchema = z.object({
  topic: z.string().trim().min(2).max(120),
  sourceTopicId: z.string().uuid().optional(),
  questionCount: z.number().int().min(3).max(30).optional().default(10),
});

function resolveQuizAnswer(answerRaw: string, options: string[]): string | null {
  const answer = answerRaw.trim();
  if (!answer || options.length === 0) return null;
  if (options.includes(answer)) return answer;

  const ci = options.find((opt) => opt.toLowerCase() === answer.toLowerCase());
  if (ci) return ci;

  if (/^[A-Za-z]$/.test(answer)) {
    const index = answer.toUpperCase().charCodeAt(0) - 65;
    return index >= 0 && index < options.length ? options[index] : null;
  }

  if (/^\d+$/.test(answer)) {
    const n = Number.parseInt(answer, 10);
    if (Number.isNaN(n)) return null;
    if (n >= 1 && n <= options.length) return options[n - 1];
    if (n >= 0 && n < options.length) return options[n];
  }

  return null;
}

function getTopicCandidates(topic: string, topicKey: string): string[] {
  const candidates = new Set<string>([topicKey]);
  const value = `${topic} ${topicKey}`.toLowerCase();

  if (value.includes("algebra") || value.includes("equation") || value.includes("linear")) {
    candidates.add("algebra");
  }
  if (value.includes("grammar") || value.includes("english") || value.includes("sentence")) {
    candidates.add("grammar");
  }
  if (value.includes("biology") || value.includes("cell") || value.includes("plant") || value.includes("science")) {
    candidates.add("biology");
  }

  return Array.from(candidates);
}

function buildOptions(correctAnswer: string, optionValues: string[], baseExplanation?: string): ExamOption[] {
  const options = optionValues.slice(0, 3);
  return options.map((opt, index) => {
    const label = (["A", "B", "C"][index] ?? "C") as "A" | "B" | "C";
    const isCorrect = opt === correctAnswer;
    return {
      label,
      text: opt,
      is_correct: isCorrect,
      explanation: isCorrect
        ? baseExplanation?.trim() || "This is the correct answer based on the concept tested in this question."
        : "This option is incorrect because it does not match the concept or rule required by the question.",
    };
  });
}

function buildQuestionFromQuiz(raw: Record<string, unknown>, topicKey: string): ExamQuestion | null {
  const q = typeof raw.q === "string" ? raw.q.trim() : typeof raw.question === "string" ? raw.question.trim() : "";
  const optionsRaw = Array.isArray(raw.options) ? raw.options : [];
  const options = optionsRaw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  const answerRaw =
    typeof raw.answer === "string" ? raw.answer : typeof raw.correct === "string" ? raw.correct : "";
  const explanation = typeof raw.explanation === "string" ? raw.explanation : "";

  if (!q || options.length < 3 || !answerRaw) return null;

  const resolvedAnswer = resolveQuizAnswer(answerRaw, options);
  if (!resolvedAnswer) return null;

  const incorrect = options.filter((opt) => opt !== resolvedAnswer);
  if (incorrect.length < 2) return null;

  const selectedOptions = shuffleArray([resolvedAnswer, ...incorrect.slice(0, 2)]);
  const examOptions = buildOptions(resolvedAnswer, selectedOptions, explanation);
  const normalized = normalizeExamQuestion({
    id: crypto.randomUUID(),
    question: q,
    topic_key: topicKey,
    subject_name: null,
    difficulty: "medium",
    options: examOptions,
  });

  return normalized;
}

function buildQuestionsFromQuizArray(rawQuiz: unknown, topicKey: string): ExamQuestion[] {
  if (!Array.isArray(rawQuiz)) return [];
  return rawQuiz
    .map((row) => (row && typeof row === "object" ? buildQuestionFromQuiz(row as Record<string, unknown>, topicKey) : null))
    .filter((item): item is ExamQuestion => Boolean(item));
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = StartSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const topic = parsed.data.topic.trim();
    const topicKey = normalizeTopicKey(topic);
    const requestedCount = parsed.data.questionCount;

    let sourceTopicId: string | null = null;
    if (parsed.data.sourceTopicId) {
      const { data: topicRow } = await supabase
        .from("topics")
        .select("id")
        .eq("id", parsed.data.sourceTopicId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!topicRow) {
        return NextResponse.json({ error: "Source topic not found" }, { status: 404 });
      }
      sourceTopicId = topicRow.id;
    }

    const topicCandidates = getTopicCandidates(topic, topicKey);
    const bankRows: Array<Record<string, unknown>> = [];

    for (const candidate of topicCandidates) {
      const { data, error } = await supabase
        .from("exam_question_bank")
        .select("id, topic_key, subject_name, question, difficulty, options")
        .eq("active", true)
        .eq("topic_key", candidate)
        .limit(100);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (data?.length) bankRows.push(...data);
      if (bankRows.length >= requestedCount) break;
    }

    if (bankRows.length < requestedCount) {
      const escapedTopic = topic.replace(/[%_]/g, "").slice(0, 50);
      const { data: fuzzyRows, error: fuzzyError } = await supabase
        .from("exam_question_bank")
        .select("id, topic_key, subject_name, question, difficulty, options")
        .eq("active", true)
        .or(`topic_key.ilike.%${escapedTopic}%,subject_name.ilike.%${escapedTopic}%`)
        .limit(100);

      if (fuzzyError) {
        return NextResponse.json({ error: fuzzyError.message }, { status: 500 });
      }
      if (fuzzyRows?.length) bankRows.push(...fuzzyRows);
    }

    const normalizedBank = bankRows
      .map((row) => normalizeExamQuestion(row))
      .filter((item): item is ExamQuestion => Boolean(item));

    let fallbackQuestions: ExamQuestion[] = [];
    if (normalizedBank.length < requestedCount && sourceTopicId) {
      const { data: quizRow } = await supabase
        .from("quiz_questions")
        .select("questions")
        .eq("topic_id", sourceTopicId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (quizRow?.questions) {
        fallbackQuestions = buildQuestionsFromQuizArray(quizRow.questions, topicKey);
      }

      if (fallbackQuestions.length < 3) {
        const { data: lessonUnit } = await supabase
          .from("lesson_units")
          .select("lesson_content")
          .eq("topic_id", sourceTopicId)
          .maybeSingle();
        const lessonQuiz = (lessonUnit?.lesson_content as Record<string, unknown> | null)?.quiz;
        fallbackQuestions = [...fallbackQuestions, ...buildQuestionsFromQuizArray(lessonQuiz, topicKey)];
      }
    }

    const deduped = new Map<string, ExamQuestion>();
    for (const question of [...normalizedBank, ...fallbackQuestions]) {
      deduped.set(question.question.trim().toLowerCase(), question);
    }

    const initialCount = deduped.size;
    let generatedCount = 0;
    if (initialCount < requestedCount) {
      const needed = requestedCount - initialCount;
      let contextQuiz: unknown = [];
      let contextLesson: Record<string, unknown> | null = null;

      if (sourceTopicId) {
        const [{ data: quizRow }, { data: lessonUnit }] = await Promise.all([
          supabase
            .from("quiz_questions")
            .select("questions")
            .eq("topic_id", sourceTopicId)
            .order("generated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("lesson_units").select("lesson_content").eq("topic_id", sourceTopicId).maybeSingle(),
        ]);
        contextQuiz = quizRow?.questions ?? [];
        contextLesson = (lessonUnit?.lesson_content as Record<string, unknown> | null) ?? null;
      }

      const generated = await generateExamQuestions({
        topic,
        topicKey,
        missingCount: needed,
        contextQuiz,
        contextLesson,
      });

      generatedCount = generated.length;

      if (generated.length > 0) {
        const rows = generated.map((question) => ({
          topic_key: topicKey,
          subject_name: question.subject_name,
          question: question.question,
          difficulty: question.difficulty,
          options: question.options,
          active: true,
          source: "generated",
          source_topic_id: sourceTopicId,
          generation_model: "structured-lesson",
          generated_at: new Date().toISOString(),
        }));

        const { error: insertBankError } = await supabase.from("exam_question_bank").insert(rows);
        if (insertBankError) {
          console.warn("[exam-prep/start] failed to persist generated exam questions:", insertBankError.message);
        }
        for (const question of generated) {
          deduped.set(question.question.trim().toLowerCase(), question);
        }
      }
    }

    if (deduped.size < requestedCount) {
      const emergencyNeeded = requestedCount - deduped.size;
      const emergency = generateEmergencyExamQuestions({
        topic,
        topicKey,
        count: emergencyNeeded,
      });
      generatedCount += emergency.length;

      for (const question of emergency) {
        deduped.set(question.question.trim().toLowerCase(), question);
      }

      if (emergency.length > 0) {
        const rows = emergency.map((question) => ({
          topic_key: topicKey,
          subject_name: question.subject_name,
          question: question.question,
          difficulty: question.difficulty,
          options: question.options,
          active: true,
          source: "generated",
          source_topic_id: sourceTopicId,
          generation_model: "emergency-template",
          generated_at: new Date().toISOString(),
        }));
        const { error: emergencyInsertError } = await supabase.from("exam_question_bank").insert(rows);
        if (emergencyInsertError) {
          console.warn("[exam-prep/start] failed to persist emergency exam questions:", emergencyInsertError.message);
        }
      }
    }

    const pool = shuffleArray(Array.from(deduped.values()));
    const selectedQuestions = pool.slice(0, requestedCount);

    if (selectedQuestions.length < 1) {
      return NextResponse.json(
        {
          error: "Could not prepare exam questions right now. Please try again shortly.",
          meta: {
            requested: requestedCount,
            available: selectedQuestions.length,
            topicKey,
            bank_count: initialCount,
            generated_count: generatedCount,
            final_count: selectedQuestions.length,
          },
        },
        { status: 422 }
      );
    }

    const { data: insertedAttempt, error: insertError } = await supabase
      .from("exam_attempts")
      .insert([
        {
          user_id: user.id,
          topic_key: topicKey,
          source_topic_id: sourceTopicId,
          question_count: selectedQuestions.length,
          question_snapshot: selectedQuestions,
          answers: null,
          correct_count: 0,
          score_percent: 0,
        },
      ])
      .select("id, topic_key, question_count, question_snapshot, completed_at")
      .single();

    if (insertError || !insertedAttempt) {
      return NextResponse.json({ error: insertError?.message || "Failed to create attempt" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          attemptId: insertedAttempt.id,
          topicKey: insertedAttempt.topic_key,
          questionCount: insertedAttempt.question_count,
          questions: insertedAttempt.question_snapshot,
          completedAt: insertedAttempt.completed_at,
        },
        meta: {
          requested: requestedCount,
          bank_count: initialCount,
          generated_count: generatedCount,
          final_count: selectedQuestions.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[exam-prep/start] error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
