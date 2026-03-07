import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPageContent from './landing-page/LandingPageContent';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/dashboard');
  }
  
  return <LandingPageContent />;
}
