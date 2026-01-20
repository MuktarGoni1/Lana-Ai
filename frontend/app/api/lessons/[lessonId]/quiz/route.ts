import { NextResponse } from 'next/server';

type Question = {
  q: string;
  options: string[];
  answer: string;
  explanation?: string;
};

// Mock data for demonstration - in a real implementation, this would fetch from a database
const mockLessonQuizzes: Record<string, Question[]> = {
  'math-intro': [
    {
      q: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      answer: "4",
      explanation: "Basic addition: 2 + 2 equals 4."
    },
    {
      q: "Which shape has 3 sides?",
      options: ["Square", "Circle", "Triangle", "Rectangle"],
      answer: "Triangle",
      explanation: "A triangle is a polygon with three sides."
    }
  ],
  'science-basics': [
    {
      q: "What planet is known as the Red Planet?",
      options: ["Earth", "Venus", "Mars", "Jupiter"],
      answer: "Mars",
      explanation: "Mars is often called the Red Planet due to iron oxide on its surface."
    },
    {
      q: "What gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
      answer: "Carbon Dioxide",
      explanation: "Plants absorb carbon dioxide during photosynthesis."
    }
  ],
  'literature-quiz': [
    {
      q: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      answer: "William Shakespeare",
      explanation: "'Romeo and Juliet' is one of Shakespeare's most famous plays."
    }
  ]
};

export async function GET(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params;
    
    // In a real implementation, you would fetch from your database
    // For now, we'll use mock data
    const quiz = mockLessonQuizzes[lessonId] || [];

    if (!quiz || quiz.length === 0) {
      return NextResponse.json(
        { error: 'Quiz not found for this lesson' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(quiz, { status: 200 });
  } catch (error) {
    console.error('Error fetching quiz by lesson ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' }, 
      { status: 500 }
    );
  }
}

// Allow CORS for local development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}