// Enhanced error handling with comprehensive HTTP status code mapping
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public originalError?: Error | unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Map HTTP status codes to user-friendly messages
export const getErrorMessage = (status: number, defaultMessage: string): string => {
  switch (status) {
    case 400:
      return 'Bad request - please check your input';
    case 401:
      return 'Authentication required - please sign in';
    case 403:
      return 'Access denied - insufficient permissions';
    case 404:
      return 'Resource not found';
    case 429:
      return 'Too many requests - please try again later';
    case 500:
      return 'Server error - please try again later';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable - please try again later';
    default:
      return defaultMessage || `Request failed with status ${status}`;
  }
};

// Parse and handle API error responses
export const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage = `API error: ${response.status}`;
  
  try {
    const errorData = await response.json();
    if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = errorData.error;
    }
  } catch {
    // If we can't parse the error response, use status text
    errorMessage = `${response.status} ${response.statusText}`;
  }
  
  // Map to user-friendly messages
  errorMessage = getErrorMessage(response.status, errorMessage);
  
  throw new ApiError(response.status, errorMessage);
};