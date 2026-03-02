import { z } from 'zod';
import { normalizeQuizQuestions } from '@/lib/api/learning-utils';

const RawSectionSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).max(5000).optional(),
  heading: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().min(1).max(5000).optional(),
});

const RawLessonContentSchema = z.object({
  introduction: z.string().trim().min(1).max(5000).optional(),
  summary: z.string().trim().min(1).max(5000).optional(),
  sections: z.array(RawSectionSchema).min(1).max(20),
  quiz: z.array(z.unknown()).min(1).max(20).optional(),
});

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
  sections: z.array(LessonSectionSchema).min(1).max(20),
  summary: z.string().trim().min(1).max(5000),
  quiz: z.array(LessonQuizSchema).min(1).max(20),
});

export type LessonContent = z.infer<typeof LessonContentSchema>;

export function validateLessonPayload(input: unknown):
  | { ok: true; data: LessonContent }
  | { ok: false; error: string } {
  const rawParsed = RawLessonContentSchema.safeParse(input);
  if (!rawParsed.success) {
    return { ok: false, error: rawParsed.error.issues.map((i) => i.message).join('; ') };
  }

  const raw = rawParsed.data;
  const normalizedSections = raw.sections
    .map((section) => ({
      title: (section.title ?? section.heading ?? '').trim(),
      content: (section.content ?? section.body ?? '').trim(),
    }))
    .filter((section) => section.title.length > 0 && section.content.length > 0);

  const normalizedQuiz = normalizeQuizQuestions(raw.quiz ?? []);
  const intro = (raw.introduction ?? raw.summary ?? '').trim();
  const summary = (raw.summary ?? raw.introduction ?? '').trim();

  const parsed = LessonContentSchema.safeParse({
    introduction: intro,
    sections: normalizedSections,
    summary,
    quiz: normalizedQuiz,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  return { ok: true, data: parsed.data };
}

export function qualityCheckLesson(lesson: LessonContent):
  | { ok: true }
  | { ok: false; reason: string } {
  if (lesson.introduction.length < 40) {
    return { ok: false, reason: 'Introduction too short' };
  }

  if (lesson.summary.length < 20) {
    return { ok: false, reason: 'Summary too short' };
  }

  if (lesson.sections.length < 1) {
    return { ok: false, reason: 'Not enough sections' };
  }

  const shortSections = lesson.sections.filter((s) => s.content.length < 40).length;
  if (shortSections > 0) {
    return { ok: false, reason: 'Section content too short' };
  }

  if (lesson.quiz.length < 1) {
    return { ok: false, reason: 'Not enough quiz questions' };
  }

  return { ok: true };
}
