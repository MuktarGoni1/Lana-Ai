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
  // Competency Assessment Questions
  {
    id: 'comp1',
    type: 'competency',
    question: 'How comfortable are you with basic arithmetic operations (addition, subtraction, multiplication, division)?',
    options: [
      { id: 'a', text: 'Very comfortable - I can solve problems quickly', value: 3 },
      { id: 'b', text: 'Somewhat comfortable - I can solve problems but sometimes need time', value: 2 },
      { id: 'c', text: 'Not very comfortable - I often struggle with basic calculations', value: 1 }
    ]
  },
  {
    id: 'comp2',
    type: 'competency',
    question: 'How would you rate your understanding of fractions and decimals?',
    options: [
      { id: 'a', text: 'Strong understanding - I can easily convert and operate with them', value: 3 },
      { id: 'b', text: 'Moderate understanding - I understand the concepts but sometimes make mistakes', value: 2 },
      { id: 'c', text: 'Limited understanding - I find fractions and decimals confusing', value: 1 }
    ]
  },
  {
    id: 'comp3',
    type: 'competency',
    question: 'How familiar are you with basic algebra concepts (variables, equations, solving for x)?',
    options: [
      { id: 'a', text: 'Very familiar - I can solve algebraic equations confidently', value: 3 },
      { id: 'b', text: 'Somewhat familiar - I understand the basics but need practice', value: 2 },
      { id: 'c', text: 'Not familiar - Algebra is challenging for me', value: 1 }
    ]
  },
  {
    id: 'comp4',
    type: 'competency',
    question: 'How would you describe your geometry skills (shapes, angles, area, perimeter)?',
    options: [
      { id: 'a', text: 'Strong - I can solve geometry problems accurately', value: 3 },
      { id: 'b', text: 'Moderate - I understand concepts but sometimes struggle with complex problems', value: 2 },
      { id: 'c', text: 'Weak - Geometry is difficult for me', value: 1 }
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

// Scoring algorithm for competency questions
export function calculateKnowledgeLevel(scores: number[]): 'beginner' | 'intermediate' | 'advanced' {
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  if (averageScore >= 2.5) {
    return 'advanced';
  } else if (averageScore >= 1.5) {
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