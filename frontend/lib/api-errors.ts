/**
 * Utility functions for handling API errors consistently across the application
 */

export const getErrorMessage = (status: number, context?: string): string => {
  const baseMessages: Record<number, string> = {
    400: "Invalid request. Please try rephrasing your question.",
    401: "Authentication required. Please log in again.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "Server error. Please try again later.",
    503: "Service temporarily unavailable.",
  };
  
  // Context-specific messages
  const contextMessages: Record<string, Partial<Record<number, string>>> = {
    math: {
      400: "Invalid math problem. Please try rephrasing your question.",
      503: "Math solver temporarily unavailable. Please try again later.",
    },
    chat: {
      503: "Chat service temporarily unavailable. Please try again later.",
    },
    lesson: {
      503: "Lesson service temporarily unavailable. Please try again later.",
    },
  };
  
  // Return context-specific message if available, otherwise use base message
  if (context && contextMessages[context] && contextMessages[context][status]) {
    return contextMessages[context][status]!;
  }
  
  return baseMessages[status] || `Server error (${status}). Please try again.`;
};