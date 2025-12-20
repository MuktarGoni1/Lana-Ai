// User-friendly error messages with recovery steps
interface ErrorMessage {
  title: string;
  description: string;
  recoverySteps?: string[];
  variant?: 'destructive' | 'warning' | 'info';
}

// Map technical error messages to user-friendly ones
export const AUTH_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Network errors
  'Network Error': {
    title: 'Connection Problem',
    description: 'We couldn\'t connect to our servers. Please check your internet connection.',
    recoverySteps: [
      'Check your Wi-Fi or mobile data connection',
      'Try turning airplane mode on and off',
      'Restart your browser'
    ],
    variant: 'warning'
  },
  
  // Authentication errors
  'Invalid login credentials': {
    title: 'Login Failed',
    description: 'The email or password you entered is incorrect.',
    recoverySteps: [
      'Double-check your email address',
      'Make sure you\'re using the correct login method',
      'Reset your password if you\'ve forgotten it'
    ]
  },
  
  // Email sending errors
  'Failed to send magic link': {
    title: 'Email Delivery Issue',
    description: 'We couldn\'t send the magic link to your email address.',
    recoverySteps: [
      'Check that your email address is correct',
      'Look in your spam or junk folder',
      'Try again in a few minutes'
    ],
    variant: 'warning'
  },
  
  // Rate limiting errors
  'Too many requests': {
    title: 'Too Many Attempts',
    description: 'You\'ve tried to log in too many times. Please wait a moment before trying again.',
    recoverySteps: [
      'Wait for 5-10 minutes before trying again',
      'Use the password reset option if you\'ve forgotten your password'
    ],
    variant: 'warning'
  },
  
  // Account not found
  'User not found': {
    title: 'Account Not Found',
    description: 'We couldn\'t find an account with that email address.',
    recoverySteps: [
      'Check that your email address is spelled correctly',
      'Try signing up for a new account',
      'Contact support if you believe this is an error'
    ]
  },
  
  // Google OAuth errors
  'Google login failed': {
    title: 'Google Login Failed',
    description: 'We couldn\'t complete the Google login process.',
    recoverySteps: [
      'Try logging in with your email instead',
      'Check that you\'re allowing pop-ups for this site',
      'Try again in a few minutes'
    ],
    variant: 'warning'
  },
  
  // Generic fallback
  'default': {
    title: 'Something Went Wrong',
    description: 'We encountered an unexpected error. Please try again.',
    recoverySteps: [
      'Refresh the page and try again',
      'Clear your browser cache and cookies',
      'Try a different browser or device',
      'Contact support if the problem persists'
    ]
  }
};

// Get user-friendly error message
export function getFriendlyErrorMessage(error: string | Error): ErrorMessage {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Check for exact matches
  if (AUTH_ERROR_MESSAGES[errorMessage]) {
    return AUTH_ERROR_MESSAGES[errorMessage];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (key !== 'default' && errorMessage.includes(key)) {
      return value;
    }
  }
  
  // Return default error message
  return AUTH_ERROR_MESSAGES['default'];
}

// Format error message for toast display
export function formatErrorForToast(error: string | Error): {
  title: string;
  description: string;
  variant?: 'destructive' | 'warning' | 'info';
} {
  const friendlyError = getFriendlyErrorMessage(error);
  
  return {
    title: friendlyError.title,
    description: friendlyError.description,
    variant: friendlyError.variant
  };
}