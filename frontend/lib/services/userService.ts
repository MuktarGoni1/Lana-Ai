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

/**
 * Update the current authenticated user's age in their metadata.
 *
 * @param age - The age to set for the user
 * @returns A promise that resolves to true if successful, false otherwise
 */
export async function updateUserAge(age: number): Promise<boolean> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { age }
    });

    if (error) {
      console.error('[userService.updateUserAge] Error updating user age:', error);
      return false;
    }

    console.debug('[userService.updateUserAge] User age updated successfully:', age);
    return true;
  } catch (error) {
    console.error('[userService.updateUserAge] Unexpected error updating user age:', error);
    return false;
  }
}