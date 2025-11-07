import { supabase } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

export class AuthService {
  async registerParent(email: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          data: { role: "guardian" },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      // Also create a record in the guardians table
      const { error: insertError } = await supabase.from("guardians").insert({
        email: email.trim(),
        weekly_report: true,
        monthly_report: false,
      });
      
      if (insertError) {
        console.warn('[AuthService] Failed to create guardian record:', insertError);
        // Don't throw here as the auth was successful
      }
      
      // Mark user as needing term plan onboarding
      localStorage.setItem('lana_first_time_term_plan', 'true');
      
      return data;
    } catch (error: unknown) {
      console.error("Failed to register parent:", error);
      throw error;
    }
  }

  async registerChild(nickname: string, age: number, grade: string) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const child_uid = crypto.randomUUID()
      const email = `${child_uid}@child.lana`
      const password = child_uid // Use child_uid as password for consistency

      // Create the auth user
      const { data, error: signError } = await supabase.auth.signUp({
        email: email,
        password: password, // Use child_uid as password for consistency
        options: {
          data: { role: "child", nickname, age, grade },
          emailRedirectTo: `${window.location.origin}/`,
        }
      })

      if (signError) throw signError

      // Store child row in users table
      const { error: insertError } = await supabase.from("users").insert({
        id: child_uid,
        email: email,
        user_metadata: { role: "child", nickname, age, grade },
      });
      
      if (insertError) {
        console.warn('[AuthService] Failed to create user record:', insertError);
        // Don't throw here as the auth was successful
      }

      // Store session ID in localStorage for anonymous users
      localStorage.setItem("lana_sid", child_uid);
      
      // Mark user as needing term plan onboarding
      localStorage.setItem('lana_first_time_term_plan', 'true');
      
      return data;
    } catch (error: unknown) {
      console.error("Failed to register child:", error);
      throw error;
    }
  }
}