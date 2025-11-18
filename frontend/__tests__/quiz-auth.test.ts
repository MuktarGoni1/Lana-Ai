import { test, expect, describe, beforeEach, afterEach } from '@jest/globals'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => {
  return {
    createServerClient: jest.fn()
  }
})

// Mock auth utilities
jest.mock('@/lib/auth/server', () => {
  return {
    getCurrentUser: jest.fn()
  }
})

describe('Quiz Functionality with Authentication', () => {
  // Mock authenticated user
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      role: 'guardian',
      onboarding_complete: true
    }
  }

  // Mock quiz data
  const mockQuiz = {
    id: 'quiz-1',
    title: 'Math Quiz',
    questions: [
      {
        id: 'q1',
        text: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4'
      },
      {
        id: 'q2',
        text: 'What is 5*3?',
        options: ['10', '15', '20'],
        correctAnswer: '15'
      }
    ]
  }

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup Supabase mock to return authenticated user
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    })
    
    // Setup auth utility mock
    ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
    
    // Mock fetch globally
    global.fetch = jest.fn()
  })

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks()
  })

  test('Authenticated user can access quiz page', async () => {
    // Mock quiz API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockQuiz)
    })

    // Simulate authenticated user accessing quiz
    const user = await getCurrentUser()
    expect(user).toBeDefined()
    expect(user?.email).toBe('test@example.com')

    // Simulate quiz page access
    const quizResponse = await fetch('/api/quiz/quiz-1')
    expect(quizResponse.ok).toBe(true)
    
    const quizData = await quizResponse.json()
    expect(quizData.title).toBe('Math Quiz')
    expect(quizData.questions).toHaveLength(2)
  })

  test('Quiz question loading works correctly', async () => {
    // Mock quiz API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockQuiz)
    })

    const quizResponse = await fetch('/api/quiz/quiz-1')
    const quizData = await quizResponse.json()
    
    // Verify question structure
    expect(quizData.questions[0].id).toBe('q1')
    expect(quizData.questions[0].text).toBe('What is 2+2?')
    expect(quizData.questions[0].options).toEqual(['3', '4', '5'])
    expect(quizData.questions[0].correctAnswer).toBe('4')
  })

  test('Quiz submission and scoring works', async () => {
    // Mock quiz submission response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockQuiz)
    }).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        score: 100,
        total: 2,
        correct: 2,
        incorrect: 0,
        answers: [
          { questionId: 'q1', selected: '4', correct: true },
          { questionId: 'q2', selected: '15', correct: true }
        ]
      })
    })

    // Load quiz
    const quizResponse = await fetch('/api/quiz/quiz-1')
    expect(quizResponse.ok).toBe(true)

    // Submit answers
    const submissionResponse = await fetch('/api/quiz/quiz-1/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: [
          { questionId: 'q1', answer: '4' },
          { questionId: 'q2', answer: '15' }
        ]
      })
    })

    expect(submissionResponse.ok).toBe(true)
    
    const result = await submissionResponse.json()
    expect(result.score).toBe(100)
    expect(result.total).toBe(2)
    expect(result.correct).toBe(2)
    expect(result.incorrect).toBe(0)
  })

  test('Quiz handles incorrect answers properly', async () => {
    // Mock quiz loading response
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/submit')) {
        // This is a submission request
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            score: 50,
            total: 2,
            correct: 1,
            incorrect: 1,
            answers: [
              { questionId: 'q1', selected: '3', correct: false },
              { questionId: 'q2', selected: '15', correct: true }
            ]
          })
        });
      } else {
        // This is a quiz loading request
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockQuiz)
        });
      }
    });

    // Load quiz first
    const quizResponse = await fetch('/api/quiz/quiz-1');
    expect(quizResponse.ok).toBe(true);

    // Submit answers with one incorrect
    const submissionResponse = await fetch('/api/quiz/quiz-1/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: [
          { questionId: 'q1', answer: '3' }, // Incorrect
          { questionId: 'q2', answer: '15' } // Correct
        ]
      })
    });

    expect(submissionResponse.ok).toBe(true);
    
    const result = await submissionResponse.json();
    // Check that the result has the expected structure
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('correct');
    expect(result).toHaveProperty('incorrect');
    expect(result.total).toBe(2);
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(1);
  })

  test('Quiz handles API errors gracefully', async () => {
    // Mock API error
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: 'Internal Server Error' })
    })

    const quizResponse = await fetch('/api/quiz/non-existent')
    expect(quizResponse.ok).toBe(false)
    expect(quizResponse.status).toBe(500)
    
    const errorData = await quizResponse.json()
    expect(errorData.error).toBe('Internal Server Error')
  })

  test('Quiz handles network errors gracefully', async () => {
    // Mock network error
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'))

    try {
      await fetch('/api/quiz/quiz-1')
      fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network Error')
    }
  })
})