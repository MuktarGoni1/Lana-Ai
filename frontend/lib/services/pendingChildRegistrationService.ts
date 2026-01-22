import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authLogger } from './authLogger';

export interface PendingChildRegistration {
  id: string;
  nickname: string;
  age: number;
  grade: string;
  guardianEmail: string;
  createdAt: string;
  parentId: string;
  status: 'pending' | 'approved' | 'rejected';
  consentGivenAt?: string;
  consentBy?: string;
}

export class PendingChildRegistrationService {
  private static instance: PendingChildRegistrationService;

  private constructor() {}

  static getInstance(): PendingChildRegistrationService {
    if (!PendingChildRegistrationService.instance) {
      PendingChildRegistrationService.instance = new PendingChildRegistrationService();
    }
    return PendingChildRegistrationService.instance;
  }

  /**
   * Store a child registration temporarily until parental consent is given
   */
  async storePendingChildRegistration(childData: Omit<PendingChildRegistration, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const adminClient = getSupabaseAdmin();
      
      // Generate a unique ID for the pending registration
      const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const registrationData: PendingChildRegistration = {
        id,
        ...childData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // Insert into a pending registrations table
      // This assumes a table named 'pending_child_registrations' exists
      const { error } = await adminClient
        .from('pending_child_registrations')
        .insert([registrationData]);

      if (error) {
        console.error('[PendingChildRegistrationService] Error storing pending registration:', error);
        return { success: false, error: error.message };
      }

      // Log the child registration pending event
      await authLogger.logChildRegistrationPending(
        childData.parentId,
        childData.guardianEmail,
        childData.nickname
      );

      return { success: true, id };
    } catch (error) {
      console.error('[PendingChildRegistrationService] Unexpected error storing pending registration:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Approve a pending child registration, creating the actual child account
   */
  async approvePendingRegistration(pendingId: string, approverId: string): Promise<{ success: boolean; error?: string; childId?: string }> {
    try {
      const adminClient = getSupabaseAdmin();
      
      // Fetch the pending registration
      const { data: pendingRegistration, error: fetchError } = await adminClient
        .from('pending_child_registrations')
        .select('*')
        .eq('id', pendingId)
        .single();

      if (fetchError) {
        console.error('[PendingChildRegistrationService] Error fetching pending registration:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (!pendingRegistration) {
        return { success: false, error: 'Pending registration not found' };
      }

      if (pendingRegistration.status !== 'pending') {
        return { success: false, error: 'Registration is not in pending state' };
      }

      // Create the actual child user account
      const { data: childAuthData, error: signUpError } = await adminClient.auth.admin.createUser({
        email: `${crypto.randomUUID()}@child.lana`,
        password: crypto.randomUUID(),
        user_metadata: { 
          role: "child", 
          nickname: pendingRegistration.nickname, 
          age: pendingRegistration.age, 
          grade: pendingRegistration.grade, 
          guardian_email: pendingRegistration.guardianEmail,
          created_from_pending_registration: pendingId
        },
      });

      if (signUpError) {
        console.error('[PendingChildRegistrationService] Error creating child user:', signUpError);
        return { success: false, error: signUpError.message };
      }

      const childUserId = childAuthData.user?.id;

      if (!childUserId) {
        return { success: false, error: 'Failed to create child user account' };
      }

      // Create the profile record linking child to parent
      const { error: profileError } = await adminClient.from('profiles').insert({
        id: childUserId,
        full_name: pendingRegistration.nickname,
        role: 'child',
        parent_id: pendingRegistration.parentId,
        diagnostic_completed: false,
        is_active: true,
        created_at: new Date().toISOString()
      });

      if (profileError) {
        console.error('[PendingChildRegistrationService] Failed to create profile:', profileError);
        
        // Rollback: Delete the created user since profile creation failed
        await adminClient.auth.admin.deleteUser(childUserId);
        
        return { success: false, error: profileError.message };
      }

      // Update the pending registration status to approved
      const { error: updateError } = await adminClient
        .from('pending_child_registrations')
        .update({ 
          status: 'approved',
          consentGivenAt: new Date().toISOString(),
          consentBy: approverId
        })
        .eq('id', pendingId);

      if (updateError) {
        console.error('[PendingChildRegistrationService] Error updating registration status:', updateError);
        // Note: The child account was created but we couldn't update the status
        // This should ideally be handled in a transaction
      }

      // Log the child registration approved event
      await authLogger.logChildRegistrationApproved(
        pendingRegistration.parentId,
        pendingRegistration.guardianEmail,
        childUserId,
        pendingRegistration.nickname
      );
      
      console.log('[PendingChildRegistrationService] Successfully approved child registration');
      
      return { success: true, childId: childUserId };
    } catch (error) {
      console.error('[PendingChildRegistrationService] Unexpected error approving registration:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Reject a pending child registration
   */
  async rejectPendingRegistration(pendingId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const adminClient = getSupabaseAdmin();
      
      // Fetch the pending registration first to get details for logging
      const { data: pendingRegistration, error: fetchError } = await adminClient
        .from('pending_child_registrations')
        .select('*')
        .eq('id', pendingId)
        .single();

      if (fetchError) {
        console.error('[PendingChildRegistrationService] Error fetching pending registration for rejection:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (!pendingRegistration) {
        return { success: false, error: 'Pending registration not found' };
      }
      
      // Update the pending registration status to rejected
      const { error } = await adminClient
        .from('pending_child_registrations')
        .update({ 
          status: 'rejected',
          consentGivenAt: new Date().toISOString()
        })
        .eq('id', pendingId);

      if (error) {
        console.error('[PendingChildRegistrationService] Error rejecting registration:', error);
        return { success: false, error: error.message };
      }

      // Log the child registration denied event
      await authLogger.logChildRegistrationDenied(
        pendingRegistration.parentId,
        pendingRegistration.guardianEmail,
        pendingRegistration.nickname,
        reason || 'Rejected by parent'
      );

      return { success: true };
    } catch (error) {
      console.error('[PendingChildRegistrationService] Unexpected error rejecting registration:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get pending registrations for a parent
   */
  async getPendingRegistrations(parentId: string): Promise<{ success: boolean; registrations?: PendingChildRegistration[]; error?: string }> {
    try {
      const adminClient = getSupabaseAdmin();
      
      const { data, error } = await adminClient
        .from('pending_child_registrations')
        .select('*')
        .eq('parentId', parentId)
        .eq('status', 'pending');

      if (error) {
        console.error('[PendingChildRegistrationService] Error fetching pending registrations:', error);
        return { success: false, error: error.message };
      }

      return { success: true, registrations: data as PendingChildRegistration[] };
    } catch (error) {
      console.error('[PendingChildRegistrationService] Unexpected error fetching pending registrations:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Clean up old pending registrations (older than 30 days)
   */
  async cleanupOldPendingRegistrations(): Promise<{ success: boolean; cleanedCount?: number; error?: string }> {
    try {
      const adminClient = getSupabaseAdmin();
      
      // Calculate date 30 days ago
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const { error, count } = await adminClient
        .from('pending_child_registrations')
        .delete()
        .lt('createdAt', cutoffDate.toISOString());

      if (error) {
        console.error('[PendingChildRegistrationService] Error cleaning up old registrations:', error);
        return { success: false, error: error.message };
      }

      console.log(`[PendingChildRegistrationService] Cleaned up ${count} old pending registrations`);
      
      return { success: true, cleanedCount: count || 0 };
    } catch (error) {
      console.error('[PendingChildRegistrationService] Unexpected error cleaning up old registrations:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const pendingChildRegistrationService = PendingChildRegistrationService.getInstance();