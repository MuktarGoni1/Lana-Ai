export type ExamOption = {
  label: "A" | "B" | "C";
  text: string;
  explanation: string;
  is_correct: boolean;
};

export type ExamQuestion = {
  id: string;
  question: string;
  topic_key: string;
  subject_name: string | null;
  difficulty: "easy" | "medium" | "hard";
  options: ExamOption[];
};

export type ExamAnswerReview = {
  question_id: string;
  selected_label: "A" | "B" | "C" | null;
  correct_label: "A" | "B" | "C";
  is_correct: boolean;
};

const OPTION_LABELS: Array<"A" | "B" | "C"> = ["A", "B", "C"];

export function normalizeTopicKey(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function normalizeOption(raw: unknown): ExamOption | null {
  if (!raw || typeof raw !== "object") return null;
  const option = raw as Record<string, unknown>;
  const labelRaw = typeof option.label === "string" ? option.label.trim().toUpperCase() : "";
  if (!OPTION_LABELS.includes(labelRaw as "A" | "B" | "C")) return null;

  const text = typeof option.text === "string" ? option.text.trim() : "";
  const explanation = typeof option.explanation === "string" ? option.explanation.trim() : "";
  const isCorrect = Boolean(option.is_correct);

  if (!text || !explanation) return null;

  return {
    label: labelRaw as "A" | "B" | "C",
    text,
    explanation,
    is_correct: isCorrect,
  };
}

export function normalizeExamQuestion(raw: unknown): ExamQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const id = typeof row.id === "string" ? row.id : "";
  const question = typeof row.question === "string" ? row.question.trim() : "";
  const topicKey = typeof row.topic_key === "string" ? row.topic_key.trim() : "";
  const subjectName = typeof row.subject_name === "string" ? row.subject_name : null;
  const difficultyRaw = typeof row.difficulty === "string" ? row.difficulty : "medium";
  const difficulty =
    difficultyRaw === "easy" || difficultyRaw === "medium" || difficultyRaw === "hard"
      ? difficultyRaw
      : "medium";
  const optionsRaw = Array.isArray(row.options) ? row.options : [];
  const options = optionsRaw.map(normalizeOption).filter((opt): opt is ExamOption => Boolean(opt));

  const correctCount = options.filter((opt) => opt.is_correct).length;
  if (!id || !question || !topicKey || options.length !== 3 || correctCount !== 1) {
    return null;
  }

  return {
    id,
    question,
    topic_key: topicKey,
    subject_name: subjectName,
    difficulty,
    options: options.sort((a, b) => OPTION_LABELS.indexOf(a.label) - OPTION_LABELS.indexOf(b.label)),
  };
}

export function gradeExamAttempt(questions: ExamQuestion[], answers: Record<string, string>) {
  let correct = 0;
  const review: ExamAnswerReview[] = [];

  for (const question of questions) {
    const selectedRaw = typeof answers[question.id] === "string" ? answers[question.id].trim().toUpperCase() : "";
    const selectedLabel = OPTION_LABELS.includes(selectedRaw as "A" | "B" | "C")
      ? (selectedRaw as "A" | "B" | "C")
      : null;
    const correctOption = question.options.find((option) => option.is_correct);
    if (!correctOption) continue;

    const isCorrect = selectedLabel === correctOption.label;
    if (isCorrect) correct += 1;
    review.push({
      question_id: question.id,
      selected_label: selectedLabel,
      correct_label: correctOption.label,
      is_correct: isCorrect,
    });
  }

  const total = questions.length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    total,
    correct,
    wrong: Math.max(0, total - correct),
    score_percent: percent,
    review,
  };
}
