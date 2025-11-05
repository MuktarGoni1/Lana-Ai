// lib/services/userService.ts
import { createClient } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

type User = Database['public']['Tables']['users']['Row'];

export class UserService {
  // Client-side methods
  private clientSupabase = createClient();

  // Server-side methods
  private serverSupabase = createServerClient();

  // Client-side method to get current user
  async getCurrentUser() {
    try {
      const { data: { session }, error } = await this.clientSupabase.auth.getSession();
      
      if (error) throw error;
      if (!session?.user) return null;
      
      return session.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Server-side method to get user by ID
  async getUserById(userId: string) {
    try {
      const { data, error } = await this.serverSupabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Unable to load user data');
    }
  }

  // Client-side method to update user profile
  async updateUserProfile(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await this.clientSupabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error('Unable to update user');
    }
  }
}