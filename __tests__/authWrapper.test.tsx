import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthWrapper from '@/app/auth-wrapper';

// Mock next/navigation router
jest.mock('next/navigation', () => {
  const replace = jest.fn();
  return {
    useRouter: () => ({ replace }),
  };
});

// Mock supabase client
jest.mock('@/lib/db', () => {
  const listeners: { cb: (event: string, session: any) => void }[] = [];
  let session: any = null;
  return {
    supabase: {
      auth: {
        onAuthStateChange: (cb: (event: string, session: any) => void) => {
          listeners.push({ cb });
          return { data: { subscription: { unsubscribe: jest.fn() } } } as any;
        },
        getSession: jest.fn(async () => ({ data: { session } })),
      },
    },
    // Helpers for tests
    __setSession: (s: any) => { session = s; },
    __emitSignedIn: () => { listeners.forEach(l => l.cb('SIGNED_IN', session)); },
  } as any;
});

describe('AuthWrapper onboarding redirects', () => {
  const { useRouter } = jest.requireMock('next/navigation');
  const replace = useRouter().replace as jest.Mock;
  const { __setSession, __emitSignedIn } = jest.requireMock('@/lib/db');

  beforeEach(() => {
    replace.mockReset();
    // Reset cookie
    document.cookie = 'lana_onboarding_complete=; Max-Age=0; path=/';
    // Default location
    window.history.replaceState({}, '', '/');
  });

  test('redirects to term-plan on mount when guardian incomplete', async () => {
    __setSession({ user: { user_metadata: { role: 'guardian' } } });

    render(<AuthWrapper><div>child</div></AuthWrapper>);

    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
    });
    const url = replace.mock.calls[0][0] as string;
    expect(url.startsWith('/term-plan?onboarding=1&returnTo=')).toBe(true);
    expect(url).toContain(encodeURIComponent('/'));
  });

  test('does not redirect to term-plan for child role', async () => {
    window.history.replaceState({}, '', '/login');
    __setSession({ user: { user_metadata: { role: 'child' } } });

    render(<AuthWrapper><div>child</div></AuthWrapper>);

    await waitFor(() => {
      // From /login should go to homepage, not term-plan
      expect(replace).toHaveBeenCalledWith('/homepage');
    });
  });

  test('does not redirect if onboarding_complete cookie present', async () => {
    document.cookie = 'lana_onboarding_complete=1; path=/';
    __setSession({ user: { user_metadata: { role: 'guardian', onboarding_complete: false } } });

    render(<AuthWrapper><div>child</div></AuthWrapper>);

    // Should not redirect to term-plan on mount
    await new Promise((r) => setTimeout(r, 50));
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining('/term-plan'));

    // Simulate a SIGNED_IN event and still no redirect to term-plan
    __emitSignedIn();
    await new Promise((r) => setTimeout(r, 50));
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining('/term-plan'));
  });

  test('skips reroute when already on /term-plan?onboarding=1', async () => {
    window.history.replaceState({}, '', '/term-plan?onboarding=1');
    __setSession({ user: { user_metadata: { role: 'guardian' } } });

    render(<AuthWrapper><div>child</div></AuthWrapper>);

    // Wait a tick for effects
    await new Promise((r) => setTimeout(r, 50));
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining('/term-plan'));
  });
});