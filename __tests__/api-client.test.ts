import { apiClient } from '../lib/api-client';
import { getErrorMessage } from '../lib/error-handler';

describe('API Client', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly message for 400 status', () => {
      const message = getErrorMessage(400, 'Bad Request');
      expect(message).toBe('Bad request - please check your input');
    });

    it('should return user-friendly message for 401 status', () => {
      const message = getErrorMessage(401, 'Unauthorized');
      expect(message).toBe('Authentication required - please sign in');
    });

    it('should return user-friendly message for 404 status', () => {
      const message = getErrorMessage(404, 'Not Found');
      expect(message).toBe('Resource not found');
    });

    it('should return user-friendly message for 500 status', () => {
      const message = getErrorMessage(500, 'Internal Server Error');
      expect(message).toBe('Server error - please try again later');
    });

    it('should return default message for unknown status', () => {
      const message = getErrorMessage(999, 'Unknown Error');
      expect(message).toBe('Unknown Error');
    });
  });
});