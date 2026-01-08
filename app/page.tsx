import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export default async function Page() {
  try {
    const supabase = await createServerClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // If user is authenticated, redirect to homepage
      redirect('/homepage');
    } else {
      // If user is not authenticated, redirect to landing page
      redirect('/landing-page');
    }
  } catch (error) {
    // On error, redirect to landing page as fallback
    redirect('/landing-page');
  }
}