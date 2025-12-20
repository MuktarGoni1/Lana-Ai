// Diagnostic Quiz Definitions and Logic
export interface QuizQuestion {
  id: string;
  type: 'competency' | 'learning-style';
  question: string;
  options: {
    id: string;
    text: string;
    value: any;
  }[];
}

export interface LearningProfile {
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
  subjects: string[];
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

// Diagnostic quiz questions
export const DIAGNOSTIC_QUESTIONS: QuizQuestion[] = [
  // Cognitive Assessment Questions
  {
    id: 'cog1',
    type: 'competency',
    question: 'Which shape comes next in the pattern: ▲, ●, ■, ▲, ●, ?',
    options: [
      { id: 'a', text: '▲', value: 0 },
      { id: 'b', text: '●', value: 0 },
      { id: 'c', text: '■', value: 1 },
      { id: 'd', text: '◆', value: 0 }
    ]
  },
  {
    id: 'cog2',
    type: 'competency',
    question: 'If 3 apples cost $1.50, how much do 5 apples cost?',
    options: [
      { id: 'a', text: '$2.00', value: 0 },
      { id: 'b', text: '$2.25', value: 0 },
      { id: 'c', text: '$2.50', value: 1 },
      { id: 'd', text: '$3.00', value: 0 }
    ]
  },
  {
    id: 'cog3',
    type: 'competency',
    question: 'Which word doesn\'t belong with the others?',
    options: [
      { id: 'a', text: 'Cat', value: 0 },
      { id: 'b', text: 'Dog', value: 0 },
      { id: 'c', text: 'Fish', value: 0 },
      { id: 'd', text: 'Tree', value: 1 }
    ]
  },
  {
    id: 'cog4',
    type: 'competency',
    question: 'If all Bloops are Razzies and all Razzies are Loppies, then all Bloops are definitely:',
    options: [
      { id: 'a', text: 'Razzies', value: 0 },
      { id: 'b', text: 'Loppies', value: 1 },
      { id: 'c', text: 'Both', value: 0 },
      { id: 'd', text: 'Neither', value: 0 }
    ]
  },
  {
    id: 'cog5',
    type: 'competency',
    question: 'Which shape completes the square pattern?',
    options: [
      { id: 'a', text: '◣', value: 0 },
      { id: 'b', text: '◤', value: 0 },
      { id: 'c', text: '◥', value: 1 },
      { id: 'd', text: '◢', value: 0 }
    ]
  },
  
  // Learning Style Questions
  {
    id: 'style1',
    type: 'learning-style',
    question: 'When learning something new, which method helps you remember information best?',
    options: [
      { id: 'a', text: 'Seeing diagrams, charts, or videos', value: 'visual' },
      { id: 'b', text: 'Listening to explanations or discussing with others', value: 'auditory' },
      { id: 'c', text: 'Doing hands-on activities or experiments', value: 'kinesthetic' },
      { id: 'd', text: 'Reading and taking notes', value: 'reading-writing' }
    ]
  },
  {
    id: 'style2',
    type: 'learning-style',
    question: 'When solving a problem, what approach do you typically prefer?',
    options: [
      { id: 'a', text: 'Drawing diagrams or visualizing the problem', value: 'visual' },
      { id: 'b', text: 'Talking through the problem out loud', value: 'auditory' },
      { id: 'c', text: 'Working with physical objects or trying different approaches', value: 'kinesthetic' },
      { id: 'd', text: 'Writing down steps and reasoning', value: 'reading-writing' }
    ]
  },
  {
    id: 'style3',
    type: 'learning-style',
    question: 'Which type of content do you find easiest to understand?',
    options: [
      { id: 'a', text: 'Infographics, maps, or illustrated guides', value: 'visual' },
      { id: 'b', text: 'Podcasts, lectures, or verbal explanations', value: 'auditory' },
      { id: 'c', text: 'Interactive simulations or real-world examples', value: 'kinesthetic' },
      { id: 'd', text: 'Articles, textbooks, or written tutorials', value: 'reading-writing' }
    ]
  }
];

// Scoring algorithm for cognitive questions
export function calculateKnowledgeLevel(scores: number[]): 'beginner' | 'intermediate' | 'advanced' {
  // For cognitive questions, 1 = correct, 0 = incorrect
  // We'll calculate percentage of correct answers
  const correctCount = scores.filter(score => score === 1).length;
  const totalCount = scores.length;
  const percentage = (correctCount / totalCount) * 100;
  
  if (percentage >= 80) {
    return 'advanced';
  } else if (percentage >= 60) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
}

// Algorithm to determine dominant learning style
export function determineLearningStyle(responses: string[]): 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' {
  const styleCounts = {
    'visual': 0,
    'auditory': 0,
    'kinesthetic': 0,
    'reading-writing': 0
  };
  
  responses.forEach(style => {
    if (style in styleCounts) {
      styleCounts[style as keyof typeof styleCounts]++;
    }
  });
  
  // Return the style with the highest count
  return Object.entries(styleCounts).reduce((a, b) => 
    styleCounts[a[0] as keyof typeof styleCounts] > styleCounts[b[0] as keyof typeof styleCounts] ? a : b
  )[0] as 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
}

// Generate personalized learning profile
export function generateLearningProfile(
  competencyScores: number[],
  learningStyleResponses: string[]
): LearningProfile {
  const knowledgeLevel = calculateKnowledgeLevel(competencyScores);
  const learningStyle = determineLearningStyle(learningStyleResponses);
  
  // Determine preferred difficulty based on knowledge level
  let preferredDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (knowledgeLevel === 'beginner') {
    preferredDifficulty = 'easy';
  } else if (knowledgeLevel === 'advanced') {
    preferredDifficulty = 'hard';
  }
  
  return {
    knowledgeLevel,
    learningStyle,
    subjects: [], // Will be populated based on user's study plan
    preferredDifficulty,
    createdAt: new Date().toISOString()
  };
}