// lib/mode-storage.ts
// Utility functions for storing and retrieving the selected mode in session storage

const MODE_STORAGE_KEY = 'lana_selected_mode';

/**
 * Save the selected mode to session storage
 * @param mode The mode to save
 */
export function saveSelectedMode(mode: string): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(MODE_STORAGE_KEY, mode);
    }
  } catch (error) {
    // Silently fail if sessionStorage is not available
    console.warn('Failed to save mode to sessionStorage:', error);
  }
}

/**
 * Get the selected mode from session storage
 * @returns The stored mode or null if not found
 */
export function getSelectedMode(): string | null {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(MODE_STORAGE_KEY);
    }
    return null;
  } catch (error) {
    // Silently fail if sessionStorage is not available
    console.warn('Failed to get mode from sessionStorage:', error);
    return null;
  }
}

/**
 * Clear the selected mode from session storage
 */
export function clearSelectedMode(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(MODE_STORAGE_KEY);
    }
  } catch (error) {
    // Silently fail if sessionStorage is not available
    console.warn('Failed to clear mode from sessionStorage:', error);
  }
}