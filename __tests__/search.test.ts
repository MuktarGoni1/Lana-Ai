import { searchSchema } from '../lib/validation';

describe('Search Utility', () => {
  it('should validate correct search input', () => {
    const validInput = 'Mathematics';
    const result = searchSchema.parse({ query: validInput });
    expect(result.query).toBe(validInput);
  });

  it('should reject empty search input', () => {
    const invalidInput = '';
    expect(() => searchSchema.parse({ query: invalidInput })).toThrow();
  });

  it('should reject too long search input', () => {
    const invalidInput = 'a'.repeat(201); // Exceeds max length of 200
    expect(() => searchSchema.parse({ query: invalidInput })).toThrow();
  });
});