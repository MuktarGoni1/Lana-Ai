/**
 * Test suite for skip navigation functionality
 * Ensures the skip button works even when there are errors
 */

import { skipToHomepage, navigateToHomepage, navigateToNextStep } from '@/lib/navigation';
import { User } from '@supabase/supabase-js';

// Mock router object
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn()
};

// Mock child user
const mockChildUser: User = {
  id: 'child-123',
  email: 'child@example.com',
  user_metadata: {
    role: 'child'
  }
} as any;

// Mock user with no role
const mockUserNoRole: User = {
  id: 'user-456',
  email: 'norole@example.com',
  user_metadata: {}
} as any;

// Mock user object
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    role: 'guardian'
  }
} as any;

describe('Skip Navigation Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mock implementation
    if (localStorage.getItem) {
      (localStorage.getItem as jest.Mock).mockReset();
    }
    if (localStorage.setItem) {
      (localStorage.setItem as jest.Mock).mockReset();
    }
  });

  describe('skipToHomepage', () => {
    it('should navigate guardian user to homepage', () => {
      // Mock localStorage setItem to track calls
      if (localStorage.setItem) {
        (localStorage.setItem as jest.Mock).mockImplementation(() => {});
      }
      
      skipToHomepage(mockRouter, mockUser);
      
      // Should store skip preference
      if (localStorage.setItem) {
        expect(localStorage.setItem).toHaveBeenCalledWith('onboardingSkipped', 'true');
      }
      
      // Should navigate to homepage
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });

    it('should navigate child user to homepage', () => {
      // Mock localStorage setItem to track calls
      if (localStorage.setItem) {
        (localStorage.setItem as jest.Mock).mockImplementation(() => {});
      }
      
      skipToHomepage(mockRouter, mockChildUser);
      
      // Should store skip preference
      if (localStorage.setItem) {
        expect(localStorage.setItem).toHaveBeenCalledWith('onboardingSkipped', 'true');
      }
      
      // Should navigate to homepage
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });

    it('should navigate user with no role to homepage', () => {
      // Mock localStorage setItem to track calls
      if (localStorage.setItem) {
        (localStorage.setItem as jest.Mock).mockImplementation(() => {});
      }
      
      skipToHomepage(mockRouter, mockUserNoRole);
      
      // Should store skip preference
      if (localStorage.setItem) {
        expect(localStorage.setItem).toHaveBeenCalledWith('onboardingSkipped', 'true');
      }
      
      // Should navigate to homepage
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });

    it('should navigate unauthenticated user to landing page', () => {
      // Mock localStorage setItem to track calls
      if (localStorage.setItem) {
        (localStorage.setItem as jest.Mock).mockImplementation(() => {});
      }
      
      skipToHomepage(mockRouter, null);
      
      // Should store skip preference
      if (localStorage.setItem) {
        expect(localStorage.setItem).toHaveBeenCalledWith('onboardingSkipped', 'true');
      }
      
      // Should navigate to landing page
      expect(mockRouter.replace).toHaveBeenCalledWith('/landing-page');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage error
      if (localStorage.setItem) {
        (localStorage.setItem as jest.Mock).mockImplementation(() => {
          throw new Error('localStorage error');
        });
      }
      
      skipToHomepage(mockRouter, mockUser);
      
      // Should still navigate even with localStorage error
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });
  });

  describe('navigateToHomepage', () => {
    it('should navigate guardian user to homepage', () => {
      navigateToHomepage(mockUser, mockRouter);
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });

    it('should navigate child user to homepage', () => {
      navigateToHomepage(mockChildUser, mockRouter);
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });

    it('should navigate user with no role to homepage', () => {
      navigateToHomepage(mockUserNoRole, mockRouter);
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });

    it('should navigate unauthenticated user to landing page', () => {
      navigateToHomepage(null, mockRouter);
      expect(mockRouter.replace).toHaveBeenCalledWith('/landing-page');
    });

    it('should fallback to landing page on navigation errors', () => {
      // Mock router error
      mockRouter.replace = jest.fn(() => {
        throw new Error('Router error');
      });
      
      navigateToHomepage(mockUser, mockRouter);
      
      // Should attempt to fallback to landing page
      expect(mockRouter.push).toHaveBeenCalledWith('/landing-page');
    });

    it("should redirect authenticated users to homepage when onboarding is complete", () => {
      const mockUser = {
        id: "test-user-id",
        email: "user@example.com",
        user_metadata: {
          onboarding_complete: true,
        },
        app_metadata: {},
        aud: "",
        created_at: "",
      } as User;
      
      navigateToHomepage(mockUser, mockRouter);
      
      expect(mockRouter.replace).toHaveBeenCalledWith("/homepage");
    });

    it("should redirect child users to homepage", () => {
      const mockUser = {
        id: "test-user-id",
        email: "child@example.com",
        user_metadata: {
          role: "child",
          onboarding_complete: true,
        },
        app_metadata: {},
        aud: "",
        created_at: "",
      } as User;
      
      navigateToHomepage(mockUser, mockRouter);
      
      expect(mockRouter.replace).toHaveBeenCalledWith("/homepage");
    });
  });

  describe('navigateToNextStep', () => {
    it('should navigate from onboarding to term-plan', () => {
      navigateToNextStep(mockRouter, 'onboarding', mockUser);
      expect(mockRouter.push).toHaveBeenCalledWith('/term-plan?onboarding=1');
    });

    it('should navigate from term-plan to homepage', () => {
      navigateToNextStep(mockRouter, 'term-plan', mockUser);
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });

    it('should fallback to homepage for unknown steps', () => {
      navigateToNextStep(mockRouter, 'unknown-step', mockUser);
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });

    it('should fallback to homepage on navigation errors', () => {
      // Mock router error
      mockRouter.push = jest.fn(() => {
        throw new Error('Router error');
      });
      
      navigateToNextStep(mockRouter, 'onboarding', mockUser);
      
      // Should fallback to homepage
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });
  });

  describe('Error Resilience', () => {
    it('should handle null router gracefully', () => {
      // This test ensures our functions don't crash with null router
      expect(() => {
        skipToHomepage(null as any, mockUser);
      }).not.toThrow();
    });

    it('should handle undefined user gracefully', () => {
      expect(() => {
        skipToHomepage(mockRouter, undefined as any);
      }).not.toThrow();
    });

    it('should handle router method errors gracefully', () => {
      // Should not crash even with router errors
      expect(() => {
        navigateToHomepage(mockUser, mockRouter);
      }).not.toThrow();
    });
  });
});