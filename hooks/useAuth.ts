import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'parent' | 'child' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile, error } = await (supabase as any).from('profiles')
          .select('role, parent_id')
          .eq('id', user.id)
          .single();
          
          if (error) {
            console.error('Error fetching profile:', error);
            // If profile doesn't exist, try to get role from user metadata
            const userRole = user.user_metadata?.role;
            setRole(userRole === 'child' || userRole === 'parent' ? userRole : null);
          } else {
            setRole(profile.role);
          }
          setUser({ ...user, profile });
        }
      } catch (error) {
        console.error('Error in getUserData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUserData();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        getUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loginWithEmail = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: "https://www.lanamind.com/auth/auto-login",
        },
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      console.error('Unexpected logout error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return { 
    user, 
    role, 
    isLoading,
    isParent: role === 'parent',
    isChild: role === 'child',
    loginWithEmail,
    logout
  };
};