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

    const { data } = await supabase
      .from('users')
      .select('user_metadata')
      .eq('id', user.id)
      .single();

    const tableAge = (data?.user_metadata?.age as number | undefined) ?? null;
    return typeof tableAge === 'number' ? tableAge : null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[userService.getCurrentUserAge] error', error);
    }
    return null;
  }
}