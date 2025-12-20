import { supabase } from './db'
import { searchSchema } from './validation'
import { sanitizeContent } from './sanitization'

export async function saveSearch(title: string) {
  try {
    // Validate input
    const validatedTitle = searchSchema.parse({ query: title }).query;
    
    // Sanitize content
    const sanitizedTitle = sanitizeContent(validatedTitle);
    
    // Get the current user's session
    const { data: sessionData } = await supabase.auth.getSession()
    const uid = sessionData.session?.user?.id
    
    // ONLY save search history for properly authenticated users
    // No fallback authentication - search history is a registered user feature
    if (!uid) {
      // Log when the message is suppressed for debugging purposes
      console.log('[saveSearch] Suppressing sign-in message for authenticated user with green indicator');
      return {
        success: false,
        message: 'Search completed!',
        suggestion: false
      }
    }
    
    // Production-safe logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[saveSearch] inserting:', sanitizedTitle)
    }

    // Completely bypass TypeScript typing issues with Supabase client
    const result: any = await (supabase as any)
      .from('searches')
      .insert({ 
        'uid': uid, 
        'title': sanitizedTitle, 
        'created_at': new Date().toISOString() 
      })

    if (process.env.NODE_ENV === 'development') {
      console.log('[saveSearch] supabase reply:', { ok: !!result.data, error: result.error?.message })
    }

    if (result.error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('❌ saveSearch error:', result.error.message)
      }
      
      // Handle specific database errors
      if (result.error.code === 'PGRST301') {
        return {
          success: false,
          message: 'Database connection error. Search completed but not saved.',
          suggestion: false
        }
      } else if (result.error.code === '23505') {
        return {
          success: true,
          message: 'Search completed and already in your history!',
          suggestion: false
        }
      } else {
        return {
          success: false,
          message: `Search completed but couldn't be saved: ${result.error.message}`,
          suggestion: false
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ saveSearch success')
      }
      return {
        success: true,
        message: 'Search saved to your history!',
        suggestion: false
      }
    }
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ saveSearch exception:', error)
    }
    let errorMessage = 'Search completed but couldn\'t be saved due to an error.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return {
      success: false,
      message: errorMessage,
      suggestion: false
    }
  }
}