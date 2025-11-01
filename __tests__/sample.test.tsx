import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// A simple component for testing
const TestComponent = () => <div data-testid="test-element">Hello World</div>;

describe('Sample Test', () => {
  it('should render correctly', () => {
    render(<TestComponent />);
    const element = screen.getByTestId('test-element');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello World');
  });
});