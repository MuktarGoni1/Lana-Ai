import { NextRequest } from 'next/server';
import { migrateGuestData as serverMigrateGuestData } from '@/lib/services/guestMigrationService.server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestId, authenticatedUserId } = body;

    if (!guestId || !authenticatedUserId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: guestId and authenticatedUserId'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Perform the migration using server-side service
    const result = await serverMigrateGuestData(guestId, authenticatedUserId);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[API Guest Migration] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during migration'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}