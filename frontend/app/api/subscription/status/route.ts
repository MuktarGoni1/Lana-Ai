import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    const metadata = session?.user?.user_metadata ?? {};
    const rawPlanCandidates = [
      metadata.plan,
      metadata.plan_name,
      metadata.subscription_plan,
      metadata.subscription_tier,
      metadata.tier,
      metadata.current_plan,
    ]
      .filter((v: unknown) => typeof v === 'string')
      .map((v: string) => v.toLowerCase().trim());

    const paidPlanNames = new Set(['family', 'family plus', 'pro', 'premium']);
    const hasPaidPlan = rawPlanCandidates.some((plan) => paidPlanNames.has(plan));

    const isPro = Boolean(metadata.is_pro || metadata.pro || hasPaidPlan);
    return NextResponse.json({ is_pro: isPro }, { status: 200 });
  } catch (e: unknown) {
    console.error('Subscription status check error:', e);
    // Even in case of error, return a valid response to prevent breaking the UI
    return NextResponse.json({ is_pro: false }, { status: 200 });
  }
}
