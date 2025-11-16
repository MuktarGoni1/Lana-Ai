import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Quiz, QuizQuestion, QuizOptions, QuizOption, QuizSubmit } from './quiz';

describe('Quiz component', () => {
  it('renders without crashing', () => {
    render(<Quiz />);
  });

  it('displays the question', () => {
    const { getByText } = render(
      <Quiz>
        <QuizQuestion>What is the capital of France?</QuizQuestion>
      </Quiz>
    );
    expect(getByText('What is the capital of France?')).toBeInTheDocument();
  });

  it('displays the options', () => {
    const { getByText } = render(
      <Quiz>
        <QuizOptions>
          <QuizOption>Paris</QuizOption>
          <QuizOption>London</QuizOption>
          <QuizOption>Berlin</QuizOption>
        </QuizOptions>
      </Quiz>
    );
    expect(getByText('Paris')).toBeInTheDocument();
    expect(getByText('London')).toBeInTheDocument();
    expect(getByText('Berlin')).toBeInTheDocument();
  });

  it('handles option selection', () => {
    const { getByText } = render(
      <Quiz>
        <QuizOptions>
          <QuizOption>Paris</QuizOption>
          <QuizOption>London</QuizOption>
          <QuizOption>Berlin</QuizOption>
        </QuizOptions>
      </Quiz>
    );
    fireEvent.click(getByText('Paris'));
  });

  it('handles form submission', () => {
    const handleSubmit = jest.fn();
    const { getByText } = render(
      <Quiz>
        <QuizSubmit onClick={handleSubmit}>Submit</QuizSubmit>
      </Quiz>
    );
    fireEvent.click(getByText('Submit'));
    expect(handleSubmit).toHaveBeenCalled();
  });
});