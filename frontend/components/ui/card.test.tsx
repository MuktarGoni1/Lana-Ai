import React from 'react';
import { render } from '@testing-library/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';

describe('Card components', () => {
  it('Card renders without crashing', () => {
    render(<Card />);
  });

  it('CardHeader renders without crashing', () => {
    render(<CardHeader />);
  });

  it('CardFooter renders without crashing', () => {
    render(<CardFooter />);
  });

  it('CardTitle renders without crashing', () => {
    render(<CardTitle />);
  });

  it('CardDescription renders without crashing', () => {
    render(<CardDescription />);
  });

  it('CardContent renders without crashing', () => {
    render(<CardContent />);
  });

  it('Card renders with children', () => {
    const { getByText } = render(<Card><div>Child</div></Card>);
    expect(getByText('Child')).toBeInTheDocument();
  });

  it('Card applies custom class names', () => {
    const { container } = render(<Card className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('Card forwards the ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});