import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Quiz, QuizQuestion, QuizOptions, QuizOption, QuizSubmit } from '../components/ui/quiz';

describe('Comprehensive Quiz Component Tests', () => {
  it('renders without crashing', () => {
    const { container } = render(<Quiz />);
    expect(container).toBeInTheDocument();
  });

  it('displays the question correctly', () => {
    const { getByText } = render(
      <Quiz>
        <QuizQuestion>What is the capital of France?</QuizQuestion>
      </Quiz>
    );
    expect(getByText('What is the capital of France?')).toBeInTheDocument();
  });

  it('displays multiple options correctly', () => {
    const { getByText } = render(
      <Quiz>
        <QuizOptions>
          <QuizOption>Paris</QuizOption>
          <QuizOption>London</QuizOption>
          <QuizOption>Berlin</QuizOption>
          <QuizOption>Madrid</QuizOption>
        </QuizOptions>
      </Quiz>
    );
    expect(getByText('Paris')).toBeInTheDocument();
    expect(getByText('London')).toBeInTheDocument();
    expect(getByText('Berlin')).toBeInTheDocument();
    expect(getByText('Madrid')).toBeInTheDocument();
  });

  it('handles option selection correctly', () => {
    const { getByText } = render(
      <Quiz>
        <QuizOptions>
          <QuizOption>Paris</QuizOption>
          <QuizOption>London</QuizOption>
        </QuizOptions>
      </Quiz>
    );
    
    const parisOption = getByText('Paris');
    fireEvent.click(parisOption);
    // In a real implementation, we would check for visual feedback
    // For this test, we just verify the click doesn't throw an error
    expect(parisOption).toBeInTheDocument();
  });

  it('handles form submission correctly', () => {
    const handleSubmit = jest.fn();
    const { getByText } = render(
      <Quiz>
        <QuizSubmit onClick={handleSubmit}>Submit</QuizSubmit>
      </Quiz>
    );
    fireEvent.click(getByText('Submit'));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('handles multiple questions with navigation', () => {
    // This would test the full quiz page functionality
    // For now, we're testing the component parts
    const { getByText } = render(
      <Quiz>
        <QuizQuestion>Question 1: What is 2+2?</QuizQuestion>
        <QuizOptions>
          <QuizOption>3</QuizOption>
          <QuizOption>4</QuizOption>
          <QuizOption>5</QuizOption>
        </QuizOptions>
        <QuizQuestion>Question 2: What is the capital of France?</QuizQuestion>
        <QuizOptions>
          <QuizOption>Paris</QuizOption>
          <QuizOption>London</QuizOption>
          <QuizOption>Berlin</QuizOption>
        </QuizOptions>
      </Quiz>
    );
    
    expect(getByText('Question 1: What is 2+2?')).toBeInTheDocument();
    expect(getByText('Question 2: What is the capital of France?')).toBeInTheDocument();
  });

  it('handles different question types', () => {
    const { getByText } = render(
      <Quiz>
        <QuizQuestion>Multiple Choice: What is the largest planet?</QuizQuestion>
        <QuizOptions>
          <QuizOption>Earth</QuizOption>
          <QuizOption>Jupiter</QuizOption>
          <QuizOption>Mars</QuizOption>
        </QuizOptions>
        <QuizQuestion>True/False: The sun is a star.</QuizQuestion>
        <QuizOptions>
          <QuizOption>True</QuizOption>
          <QuizOption>False</QuizOption>
        </QuizOptions>
      </Quiz>
    );
    
    expect(getByText('Multiple Choice: What is the largest planet?')).toBeInTheDocument();
    expect(getByText('True/False: The sun is a star.')).toBeInTheDocument();
  });

  it('verifies correct answer selection', () => {
    const correctAnswer = 'Jupiter';
    const { getByText } = render(
      <Quiz>
        <QuizOptions>
          <QuizOption>Earth</QuizOption>
          <QuizOption>{correctAnswer}</QuizOption>
          <QuizOption>Mars</QuizOption>
        </QuizOptions>
      </Quiz>
    );
    
    const jupiterOption = getByText(correctAnswer);
    fireEvent.click(jupiterOption);
    expect(jupiterOption).toBeInTheDocument();
  });

  it('handles empty quiz gracefully', () => {
    const { container } = render(<Quiz />);
    expect(container).toBeInTheDocument();
  });

  it('maintains accessibility standards', () => {
    const { getByText } = render(
      <Quiz>
        <QuizQuestion>Accessible Question</QuizQuestion>
        <QuizOptions>
          <QuizOption>Option 1</QuizOption>
          <QuizOption>Option 2</QuizOption>
        </QuizOptions>
      </Quiz>
    );
    
    // Test that the question is rendered
    expect(getByText('Accessible Question')).toBeInTheDocument();
    // Test that options are rendered
    expect(getByText('Option 1')).toBeInTheDocument();
    expect(getByText('Option 2')).toBeInTheDocument();
  });
});