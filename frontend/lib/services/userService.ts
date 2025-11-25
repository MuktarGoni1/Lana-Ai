import { supabase } from '@/lib/db';

/**
 * Get the current authenticated user's age.
 *
 * Attempts to read `age` from the auth session's user metadata first.
 * Returns `null` when no authenticated user is available or age cannot be determined.
 */
export async function getCurrentUserAge(): Promise<number | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;

    const metaAge = user.user_metadata?.age as number | undefined;
    if (typeof metaAge === 'number') {
      return metaAge;
    }

    // If not in metadata, we don't have a users table, so we can't query it
    // The age should be in the user metadata from Supabase auth
    console.debug('[userService.getCurrentUserAge] User age not found in metadata, using null');
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[userService.getCurrentUserAge] error', error);
    }
    return null;
  }
}