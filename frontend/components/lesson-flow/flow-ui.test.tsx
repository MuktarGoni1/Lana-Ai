import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ErrorState,
  LessonShell,
  QuizRenderer,
  VideoSection,
} from "./flow-ui";
import type { QuizQuestion } from "@/hooks/useLessonData";

describe("Lesson flow button visibility and navigation", () => {
  test("error retry button is visible and keyboard focusable", async () => {
    const user = userEvent.setup();
    render(<ErrorState message="Something failed." onRetry={() => {}} />);

    const retry = screen.getByRole("button", { name: /try again/i });
    expect(retry).toBeVisible();

    await user.tab();
    expect(retry).toHaveFocus();
  });

  test("quiz submit button remains visible and enabled after all answers", async () => {
    const user = userEvent.setup();
    const questions: QuizQuestion[] = [
      {
        id: "q1",
        question: "Pick one",
        correct_answer: "A",
        options: [
          { label: "A", value: "A" },
          { label: "B", value: "B" },
        ],
        difficulty: "easy",
        explanation: "A is correct",
      },
    ];

    render(<QuizRenderer questions={questions} isLoading={false} onSubmitQuiz={() => {}} />);

    const submit = screen.getByRole("button", { name: /submit quiz/i });
    expect(submit).toBeVisible();
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /a/i }));
    expect(submit).toBeEnabled();
  });

  test("video retry button is visible in failed state", () => {
    render(<VideoSection videoUrl={null} status="failed" progress={0} error="Failed" onRetry={() => {}} />);
    expect(screen.getByRole("button", { name: /retry video/i })).toBeVisible();
  });

  test("step shell remains visible with status chips", () => {
    render(
      <LessonShell
        subjectName="Mathematics"
        topicTitle="Fractions"
        step="learn"
        lessonStatus="ready"
        quizStatus="pending"
        videoStatus="pending"
      >
        <button type="button">Continue to quiz</button>
      </LessonShell>
    );

    expect(screen.getByText(/fractions/i)).toBeVisible();
    expect(screen.getByText(/lesson ready/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /continue to quiz/i })).toBeVisible();
  });

  test("visual baseline: lesson shell button block rendering", () => {
    const { asFragment } = render(
      <LessonShell
        subjectName="Science"
        topicTitle="Photosynthesis"
        step="video"
        lessonStatus="ready"
        quizStatus="ready"
        videoStatus="pending"
      >
        <div>
          <button type="button">Back to quiz</button>
          <button type="button">Finish and return to lessons</button>
        </div>
      </LessonShell>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
