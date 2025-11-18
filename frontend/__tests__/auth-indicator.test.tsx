import React from 'react';
import { render } from '@testing-library/react';
import { AuthIndicator } from '../components/auth-indicator';

// Mock the useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: jest.fn(),
  }),
}));

describe('AuthIndicator', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(<AuthIndicator />);
    }).not.toThrow();
  });
});