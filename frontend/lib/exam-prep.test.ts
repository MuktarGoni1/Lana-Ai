import { gradeExamAttempt, normalizeExamQuestion, normalizeTopicKey } from "@/lib/exam-prep";

describe("exam-prep utilities", () => {
  test("normalizeTopicKey produces stable topic key", () => {
    expect(normalizeTopicKey("  Basic Algebra! ")).toBe("basic-algebra");
  });

  test("normalizeExamQuestion accepts valid A/B/C shape", () => {
    const question = normalizeExamQuestion({
      id: "q1",
      question: "2 + 2 = ?",
      topic_key: "algebra",
      subject_name: "Math",
      difficulty: "easy",
      options: [
        { label: "A", text: "4", explanation: "Correct.", is_correct: true },
        { label: "B", text: "3", explanation: "Not correct.", is_correct: false },
        { label: "C", text: "5", explanation: "Not correct.", is_correct: false },
      ],
    });

    expect(question).not.toBeNull();
    expect(question?.options).toHaveLength(3);
  });

  test("gradeExamAttempt returns correct scoring", () => {
    const question = normalizeExamQuestion({
      id: "q1",
      question: "2 + 2 = ?",
      topic_key: "algebra",
      subject_name: "Math",
      difficulty: "easy",
      options: [
        { label: "A", text: "4", explanation: "Correct.", is_correct: true },
        { label: "B", text: "3", explanation: "Not correct.", is_correct: false },
        { label: "C", text: "5", explanation: "Not correct.", is_correct: false },
      ],
    });
    expect(question).not.toBeNull();

    const result = gradeExamAttempt([question!], { q1: "A" });
    expect(result.correct).toBe(1);
    expect(result.wrong).toBe(0);
    expect(result.score_percent).toBe(100);
  });
});
