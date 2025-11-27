import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import QuizPage from '../app/quiz/page';

// Mock next/navigation
const mockRouter = {
  back: jest.fn(),
  push: jest.fn()
};

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: () => mockRouter
}));

// Mock the quiz data
const mockQuizData = [
  {
    q: "What is the capital of France?",
    options: ["Paris", "London", "Berlin", "Madrid"],
    answer: "Paris"
  },
  {
    q: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    answer: "4"
  }
];

describe('Quiz Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    });
  });

  it('should display loading state initially', () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    });
    
    render(<QuizPage />);
    expect(screen.getByText('Loading quiz...')).toBeInTheDocument();
  });

  it('should display quiz questions when data is provided', async () => {
    const encodedData = encodeURIComponent(JSON.stringify(mockQuizData));
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((key) => {
        if (key === 'data') return encodedData;
        return null;
      })
    });
    
    render(<QuizPage />);
    
    // Wait for the quiz to load
    await waitFor(() => {
      expect(screen.getByText('1. What is the capital of France?')).toBeInTheDocument();
    });
    
    // Check that options are displayed
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });

  it('should display error message when no quiz data is available', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    });
    
    render(<QuizPage />);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Sorry, no quiz questions are available for this lesson.')).toBeInTheDocument();
    });
  });
});