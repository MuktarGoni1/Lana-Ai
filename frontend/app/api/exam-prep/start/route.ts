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

function extractQuizQuestionPayloads(rawQuestions: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(rawQuestions)) return [];
  return rawQuestions
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map((row) => {
      const question =
        typeof row.question === "string"
          ? row.question
          : typeof row.q === "string"
          ? row.q
          : typeof row.prompt === "string"
          ? row.prompt
          : "";

      const optionsRaw = Array.isArray(row.options)
        ? row.options
        : Array.isArray(row.choices)
        ? row.choices
        : [];

      const options = optionsRaw
        .map((opt) => {
          if (typeof opt === "string") return opt;
          if (opt && typeof opt === "object" && typeof (opt as Record<string, unknown>).option === "string") {
            return (opt as Record<string, unknown>).option as string;
          }
          return "";
        })
        .map((opt) => opt.trim())
        .filter(Boolean);

      const answer =
        typeof row.answer === "string"
          ? row.answer
          : typeof row.correct === "string"
          ? row.correct
          : typeof row.correct_answer === "string"
          ? row.correct_answer
          : "";

      const explanation = typeof row.explanation === "string" ? row.explanation : "";

      return {
        question,
        q: question,
        options,
        answer,
        explanation,
      };
    })
    .filter((row) => Boolean(row.question) && Array.isArray(row.options) && row.options.length >= 3 && Boolean(row.answer));
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
    } else {
      // Try to map free-text exam topics to an existing user topic so we can reuse quiz question fallbacks.
      const { data: userTopics } = await supabase
        .from("topics")
        .select("id, title")
        .eq("user_id", user.id)
        .limit(300);

      const matchedTopic = (userTopics ?? []).find((row) => normalizeTopicKey(row.title ?? "") === topicKey);
      if (matchedTopic?.id) {
        sourceTopicId = matchedTopic.id;
      }
    }

    const { data: bankRows, error: bankError } = await supabase
      .from("exam_question_bank")
      .select("id, topic_key, subject_name, question, difficulty, options")
      .eq("active", true)
      .eq("topic_key", topicKey)
      .limit(200);

    if (bankError) {
      return NextResponse.json({ error: bankError.message }, { status: 500 });
    }

    const normalizedBank = (bankRows ?? [])
      .map((row) => normalizeExamQuestion(row))
      .filter((item): item is ExamQuestion => Boolean(item));

    let fallbackQuestions: ExamQuestion[] = [];
    if (normalizedBank.length < requestedCount && sourceTopicId) {
      const { data: quizRows } = await supabase
        .from("quiz_questions")
        .select("questions")
        .eq("topic_id", sourceTopicId)
        .order("generated_at", { ascending: false })
        .limit(20);

      const questionPayloads = (quizRows ?? []).flatMap((row) => extractQuizQuestionPayloads((row as { questions?: unknown }).questions));
      fallbackQuestions = questionPayloads
        .map((row) => buildQuestionFromQuiz(row, topicKey))
        .filter((item): item is ExamQuestion => Boolean(item));
    }

    const dedupByQuestion = new Map<string, ExamQuestion>();
    for (const question of [...normalizedBank, ...fallbackQuestions]) {
      const key = question.question.trim().toLowerCase();
      if (!dedupByQuestion.has(key)) {
        dedupByQuestion.set(key, question);
      }
    }

    // Persist generated fallback questions to the bank so future attempts on the same topic can reuse them.
    if (fallbackQuestions.length > 0) {
      const bankRowsToInsert = fallbackQuestions.map((question) => ({
        topic_key: question.topic_key,
        subject_name: question.subject_name,
        question: question.question,
        difficulty: question.difficulty,
        options: question.options,
        active: true,
      }));
      const { error: bankInsertError } = await supabase.from("exam_question_bank").insert(bankRowsToInsert);
      if (bankInsertError) {
        console.warn("[exam-prep/start] fallback bank insert warning:", bankInsertError.message);
      }
    }

    const pool = shuffleArray(Array.from(dedupByQuestion.values()));
    const selectedQuestions = pool.slice(0, requestedCount);

    if (selectedQuestions.length < 3) {
      return NextResponse.json(
        { error: "Not enough exam questions for this topic yet. Please try another topic." },
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
