import { generateStructuredLesson, normalizeQuizQuestions } from '@/lib/api/learning-utils';
import { qualityCheckLesson, validateLessonPayload } from '@/lib/api/lesson-schema';

const STALE_PROCESSING_MS = 2 * 60 * 1000;

export async function processLessonGenerationJob(supabase: any, jobId: string, userId: string) {
  const nowIso = new Date().toISOString();

  const { data: job, error: jobError } = await supabase
    .from('lesson_generation_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .maybeSingle();

  if (jobError || !job) {
    throw new Error(jobError?.message || 'Job not found');
  }

  if (job.status === 'completed' || job.status === 'failed') {
    return job;
  }

  if (job.status === 'processing') {
    const updatedAt = job.updated_at ? new Date(job.updated_at).getTime() : 0;
    if (Date.now() - updatedAt < STALE_PROCESSING_MS) {
      return job;
    }
  }

  await supabase
    .from('lesson_generation_jobs')
    .update({ status: 'processing', updated_at: nowIso })
    .eq('id', job.id)
    .eq('user_id', userId);

  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id, user_id, title, status')
    .eq('id', job.topic_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (topicError || !topic) {
    await failJob(supabase, job.id, userId, 'TOPIC_NOT_FOUND', topicError?.message || 'Topic not found');
    const { data: failedJob } = await supabase.from('lesson_generation_jobs').select('*').eq('id', job.id).maybeSingle();
    return failedJob;
  }

  const { data: existingUnit } = await supabase
    .from('lesson_units')
    .select('id, lesson_content, is_ready')
    .eq('topic_id', topic.id)
    .maybeSingle();

  if (existingUnit && existingUnit.is_ready && !job.force_refresh) {
    const existingValidation = validateLessonPayload(existingUnit.lesson_content);
    if (existingValidation.ok && qualityCheckLesson(existingValidation.data).ok) {
      const normalizedQuiz = normalizeQuizQuestions((existingUnit.lesson_content as any)?.quiz);
      if (normalizedQuiz.length > 0) {
        await supabase.from('quiz_questions').delete().eq('topic_id', topic.id);
        await supabase.from('quiz_questions').insert([{ topic_id: topic.id, questions: normalizedQuiz }]);
      }

      await completeJob(supabase, job.id, userId, existingUnit.id);
      const { data: completedJob } = await supabase.from('lesson_generation_jobs').select('*').eq('id', job.id).maybeSingle();
      return completedJob;
    }
  }

  const { data: profile } = await supabase.from('profiles').select('age').eq('id', userId).maybeSingle();

  let finalLesson: any = null;
  let finalQuiz: ReturnType<typeof normalizeQuizQuestions> = [];
  let lastError = 'Unknown generation error';

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await supabase
      .from('lesson_generation_jobs')
      .update({ attempt_count: attempt, updated_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('user_id', userId);

    try {
      const generated = await generateStructuredLesson(topic.title, profile?.age ?? null);
      const validation = validateLessonPayload(generated);
      if (!validation.ok) {
        lastError = `Schema validation failed: ${validation.error}`;
        continue;
      }

      const quality = qualityCheckLesson(validation.data);
      if (!quality.ok) {
        lastError = `Quality check failed: ${quality.reason}`;
        continue;
      }

      const quiz = normalizeQuizQuestions(validation.data.quiz);
      if (quiz.length < 3) {
        lastError = 'Quiz did not include enough valid questions';
        continue;
      }

      finalLesson = validation.data;
      finalQuiz = quiz;
      break;
    } catch (error: any) {
      lastError = error?.message || 'Generation request failed';
    }
  }

  if (!finalLesson) {
    await failJob(supabase, job.id, userId, 'VALIDATION_FAILED', lastError);
    const { data: failedJob } = await supabase.from('lesson_generation_jobs').select('*').eq('id', job.id).maybeSingle();
    return failedJob;
  }

  const lessonUpsertPayload = existingUnit
    ? {
        id: existingUnit.id,
        topic_id: topic.id,
        lesson_content: finalLesson,
        is_ready: true,
        refreshed_at: nowIso,
      }
    : {
        topic_id: topic.id,
        lesson_content: finalLesson,
        is_ready: true,
        generated_at: nowIso,
      };

  const { data: savedUnit, error: unitError } = await supabase
    .from('lesson_units')
    .upsert(lessonUpsertPayload)
    .select('id')
    .single();

  if (unitError || !savedUnit) {
    await failJob(supabase, job.id, userId, 'LESSON_PERSIST_FAILED', unitError?.message || 'Failed to save lesson unit');
    const { data: failedJob } = await supabase.from('lesson_generation_jobs').select('*').eq('id', job.id).maybeSingle();
    return failedJob;
  }

  await supabase.from('quiz_questions').delete().eq('topic_id', topic.id);
  const { error: quizError } = await supabase
    .from('quiz_questions')
    .insert([{ topic_id: topic.id, questions: finalQuiz }]);

  if (quizError) {
    await failJob(supabase, job.id, userId, 'QUIZ_PERSIST_FAILED', quizError.message);
    const { data: failedJob } = await supabase.from('lesson_generation_jobs').select('*').eq('id', job.id).maybeSingle();
    return failedJob;
  }

  await supabase
    .from('topics')
    .update({ status: 'in_progress', unlocked_at: nowIso, updated_at: nowIso })
    .eq('id', topic.id)
    .in('status', ['available', 'locked']);

  await completeJob(supabase, job.id, userId, savedUnit.id);
  const { data: completedJob } = await supabase.from('lesson_generation_jobs').select('*').eq('id', job.id).maybeSingle();
  return completedJob;
}

async function failJob(supabase: any, jobId: string, userId: string, errorCode: string, errorMessage: string) {
  await supabase
    .from('lesson_generation_jobs')
    .update({
      status: 'failed',
      error_code: errorCode,
      error_message: errorMessage?.slice(0, 500) ?? 'Generation failed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', userId);
}

async function completeJob(supabase: any, jobId: string, userId: string, lessonUnitId: string) {
  await supabase
    .from('lesson_generation_jobs')
    .update({
      status: 'completed',
      result_lesson_unit_id: lessonUnitId,
      error_code: null,
      error_message: null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', userId);
}
