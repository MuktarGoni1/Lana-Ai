// Strict TypeScript interfaces for API responses
// These interfaces ensure type safety and data contract synchronization

// Lesson section structure
export interface LessonSection {
  title?: string;
  content?: string;
}

// Quiz item structure
export interface LessonQuizItem {
  question: string;
  options: string[];
  answer: string;
}

// Classification structure
export interface LessonClassification {
  type: string;
  description: string;
}

// Main structured lesson response
export interface StructuredLessonResponse {
  introduction?: string;
  classifications?: LessonClassification[];
  sections?: LessonSection[];
  diagram?: string;
  quiz?: LessonQuizItem[];
}

// Search history item
export interface SearchHistoryItem {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

// User profile
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  age?: number;
  created_at: string;
}

// Authentication response
export interface AuthResponse {
  user: UserProfile;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

// Error response structure
export interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
}
