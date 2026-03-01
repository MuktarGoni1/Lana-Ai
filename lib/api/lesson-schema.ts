import { z } from 'zod';

export const LessonSectionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(5000),
});

export const LessonQuizSchema = z.object({
  q: z.string().trim().min(1).max(500),
  options: z.array(z.string().trim().min(1).max(200)).min(2).max(8),
  answer: z.string().trim().min(1).max(200),
  explanation: z.string().trim().max(500).optional(),
});

export const LessonContentSchema = z.object({
  introduction: z.string().trim().min(1).max(5000),
  sections: z.array(LessonSectionSchema).min(2).max(20),
  summary: z.string().trim().min(1).max(3000),
  quiz: z.array(LessonQuizSchema).min(3).max(20),
});

export type LessonContent = z.infer<typeof LessonContentSchema>;

export function validateLessonPayload(input: unknown):
  | { ok: true; data: LessonContent }
  | { ok: false; error: string } {
  const parsed = LessonContentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  const quizAllValid = parsed.data.quiz.every((q) => q.options.includes(q.answer));
  if (!quizAllValid) {
    return { ok: false, error: 'Quiz answer must be one of the options for each question' };
  }

  return { ok: true, data: parsed.data };
}

export function qualityCheckLesson(lesson: LessonContent):
  | { ok: true }
  | { ok: false; reason: string } {
  if (lesson.introduction.length < 40) {
    return { ok: false, reason: 'Introduction too short' };
  }

  if (lesson.summary.length < 30) {
    return { ok: false, reason: 'Summary too short' };
  }

  if (lesson.sections.length < 2) {
    return { ok: false, reason: 'Not enough sections' };
  }

  const shortSections = lesson.sections.filter((s) => s.content.length < 60).length;
  if (shortSections > 0) {
    return { ok: false, reason: 'Section content too short' };
  }

  if (lesson.quiz.length < 3) {
    return { ok: false, reason: 'Not enough quiz questions' };
  }

  return { ok: true };
}