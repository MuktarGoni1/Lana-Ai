import { z } from 'zod';

// Validation schemas for form inputs
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  age: z.number().min(10, 'Age must be at least 10 years').max(100, 'Age must be less than 100 years'),
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Search query must be less than 200 characters'),
});

export const quizAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1, 'Please select an answer'),
});

// Type inference from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type QuizAnswerData = z.infer<typeof quizAnswerSchema>;