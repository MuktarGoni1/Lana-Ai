import { loginSchema, registerSchema, searchSchema } from '../lib/validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };
      
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        age: 25,
      };
      
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: '',
        age: 25,
      };
      
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid age', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        age: -5,
      };
      
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });
  });

  describe('searchSchema', () => {
    it('should validate correct search query', () => {
      const validData = {
        query: 'Mathematics',
      };
      
      expect(() => searchSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty query', () => {
      const invalidData = {
        query: '',
      };
      
      expect(() => searchSchema.parse(invalidData)).toThrow();
    });

    it('should reject too long query', () => {
      const invalidData = {
        query: 'a'.repeat(201), // 201 characters, exceeds max of 200
      };
      
      expect(() => searchSchema.parse(invalidData)).toThrow();
    });
  });
});