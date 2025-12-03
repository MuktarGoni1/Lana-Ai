import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button component', () => {
  it('renders without crashing', () => {
    render(<Button />);
  });

  it('displays the correct text', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    const { getByText } = render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('is disabled when the disabled prop is true', () => {
    const { getByRole } = render(<Button disabled />);
    const button = getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders the correct variant', () => {
    const { getByRole } = render(<Button variant="destructive" />);
    const button = getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('renders the correct size', () => {
    const { getByRole } = render(<Button size="sm" />);
    const button = getByRole('button');
    expect(button).toHaveClass('h-9');
  });

  it('renders as a child component', () => {
    const { getByTestId } = render(
      <Button asChild>
        <a data-testid="child-link" href="#">Click me</a>
      </Button>
    );
    const childLink = getByTestId('child-link');
    expect(childLink).toBeInTheDocument();
    expect(childLink.tagName).toBe('A');
  });

  it('forwards the ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});