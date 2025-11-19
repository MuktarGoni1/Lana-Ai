import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Textarea } from './textarea';

describe('Textarea component', () => {
  it('renders without crashing', () => {
    render(<Textarea />);
  });

  it('displays the placeholder text', () => {
    const { getByPlaceholderText } = render(<Textarea placeholder="Test placeholder" />);
    expect(getByPlaceholderText('Test placeholder')).toBeInTheDocument();
  });

  it('handles user input', () => {
    const { getByRole } = render(<Textarea />);
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test input' } });
    expect(textarea.value).toBe('Test input');
  });

  it('is disabled when the disabled prop is true', () => {
    const { getByRole } = render(<Textarea disabled />);
    const textarea = getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('applies custom class names', () => {
    const { getByRole } = render(<Textarea className="custom-class" />);
    const textarea = getByRole('textbox');
    expect(textarea).toHaveClass('custom-class');
  });

  it('forwards the ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});