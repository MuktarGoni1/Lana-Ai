import { supabase } from '@/lib/db';

/**
 * Get the current authenticated user's age.
 *
 * Attempts to read `age` from the auth session's user metadata first.
 * If not present, falls back to querying the `users` table for `user_metadata.age`.
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

    // Try to get age from users table, but handle case where table doesn't exist
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_metadata')
        .eq('id', user.id)
        .single();

      // If there's an error (like table not existing), return null
      if (error) {
        console.debug('[userService.getCurrentUserAge] users table query error:', error);
        return null;
      }

      const tableAge = (data?.user_metadata?.age as number | undefined) ?? null;
      return typeof tableAge === 'number' ? tableAge : null;
    } catch (tableError) {
      // If the users table doesn't exist, that's okay - just return null
      console.debug('[userService.getCurrentUserAge] users table may not exist:', tableError);
      return null;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[userService.getCurrentUserAge] error', error);
    }
    return null;
  }
}