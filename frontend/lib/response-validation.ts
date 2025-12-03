// lib/response-validation.ts
// Utility functions for validating response structure and formatting

/**
 * Validate that a lesson response has the required structure
 * @param lesson The lesson object to validate
 * @returns True if valid, false otherwise
 */
export function isValidLessonResponse(lesson: any): boolean {
  // Check if lesson is an object
  if (!lesson || typeof lesson !== 'object') {
    return false;
  }

  // Check for required fields
  if (typeof lesson.introduction !== 'string') {
    return false;
  }

  // Check sections array
  if (!Array.isArray(lesson.sections)) {
    return false;
  }

  // Validate each section has required fields
  for (const section of lesson.sections) {
    if (!section || typeof section !== 'object') {
      return false;
    }
    if (typeof section.title !== 'string' || typeof section.content !== 'string') {
      return false;
    }
    // Check for minimum content length
    if (section.title.trim().length === 0 || section.content.trim().length === 0) {
      return false;
    }
  }

  // Check quiz if present
  if (lesson.quiz !== undefined && !Array.isArray(lesson.quiz)) {
    return false;
  }

  if (Array.isArray(lesson.quiz)) {
    for (const quizItem of lesson.quiz) {
      if (!quizItem || typeof quizItem !== 'object') {
        return false;
      }
      if (typeof quizItem.q !== 'string' || !Array.isArray(quizItem.options) || typeof quizItem.answer !== 'string') {
        return false;
      }
      if (quizItem.q.trim().length === 0 || quizItem.options.length < 2 || quizItem.answer.trim().length === 0) {
        return false;
      }
      for (const option of quizItem.options) {
        if (typeof option !== 'string' || option.trim().length === 0) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Validate that a math solution response has the required structure
 * @param solution The math solution object to validate
 * @returns True if valid, false otherwise
 */
export function isValidMathSolutionResponse(solution: any): boolean {
  // Check if solution is an object
  if (!solution || typeof solution !== 'object') {
    return false;
  }

  // Check for required fields
  if (typeof solution.problem !== 'string' || typeof solution.solution !== 'string') {
    return false;
  }

  // Check steps if present
  if (solution.steps !== undefined && !Array.isArray(solution.steps)) {
    return false;
  }

  if (Array.isArray(solution.steps)) {
    for (const step of solution.steps) {
      if (!step || typeof step !== 'object') {
        return false;
      }
      if (typeof step.description !== 'string') {
        return false;
      }
      if (step.description.trim().length === 0) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Sanitize and format lesson content for display
 * @param lesson The lesson object to sanitize
 * @returns The sanitized lesson object
 */
export function sanitizeLessonContent(lesson: any): any {
  if (!lesson || typeof lesson !== 'object') {
    return lesson;
  }

  // Create a copy to avoid mutating the original
  const sanitized: any = {};

  // Sanitize introduction
  sanitized.introduction = typeof lesson.introduction === 'string' 
    ? lesson.introduction.trim() 
    : '';

  // Sanitize sections
  if (Array.isArray(lesson.sections)) {
    sanitized.sections = lesson.sections.map((section: any) => {
      if (!section || typeof section !== 'object') {
        return { title: '', content: '' };
      }
      return {
        title: typeof section.title === 'string' ? section.title.trim() : '',
        content: typeof section.content === 'string' ? section.content.trim() : ''
      };
    }).filter((section: any) => section.title || section.content); // Remove empty sections
  } else {
    sanitized.sections = [];
  }

  // Sanitize quiz
  if (Array.isArray(lesson.quiz)) {
    sanitized.quiz = lesson.quiz.map((quizItem: any) => {
      if (!quizItem || typeof quizItem !== 'object') {
        return null;
      }
      return {
        q: typeof quizItem.q === 'string' ? quizItem.q.trim() : '',
        options: Array.isArray(quizItem.options) 
          ? quizItem.options.map((opt: any) => typeof opt === 'string' ? opt.trim() : '').filter(Boolean)
          : [],
        answer: typeof quizItem.answer === 'string' ? quizItem.answer.trim() : ''
      };
    }).filter(Boolean); // Remove invalid quiz items
  } else {
    sanitized.quiz = [];
  }

  return sanitized;
}

/**
 * Sanitize and format math solution content for display
 * @param solution The math solution object to sanitize
 * @returns The sanitized math solution object
 */
export function sanitizeMathSolutionContent(solution: any): any {
  if (!solution || typeof solution !== 'object') {
    return solution;
  }

  // Create a copy to avoid mutating the original
  const sanitized: any = {};

  // Sanitize problem and solution
  sanitized.problem = typeof solution.problem === 'string' ? solution.problem.trim() : '';
  sanitized.solution = typeof solution.solution === 'string' ? solution.solution.trim() : '';

  // Sanitize steps
  if (Array.isArray(solution.steps)) {
    sanitized.steps = solution.steps.map((step: any) => {
      if (!step || typeof step !== 'object') {
        return { description: '', expression: null };
      }
      return {
        description: typeof step.description === 'string' ? step.description.trim() : '',
        expression: typeof step.expression === 'string' ? step.expression.trim() : (step.expression || null)
      };
    }).filter((step: any) => step.description); // Remove empty steps
  } else {
    sanitized.steps = [];
  }

  return sanitized;
}