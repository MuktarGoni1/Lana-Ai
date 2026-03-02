import { NextRequest, NextResponse } from 'next/server';

// This is a mock API route - in a real implementation, this would connect to Stripe
export async function POST(request: NextRequest) {
  try {
    const { planName, interval, billingInfo } = await request.json();

    // Sanitize and validate inputs
    const sanitizedPlanName = typeof planName === 'string' ? planName.trim() : '';
    const sanitizedInterval = typeof interval === 'string' ? interval.trim() : '';
    
    // Validate required fields exist and are of correct type
    if (!sanitizedPlanName || !sanitizedInterval || !billingInfo || typeof billingInfo !== 'object') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate plan name is in allowed list
    const allowedPlans = ['Free', 'Family', 'Family Plus'];
    if (!allowedPlans.includes(sanitizedPlanName)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }
    
    // Validate interval
    if (!['monthly', 'yearly'].includes(sanitizedInterval)) {
      return NextResponse.json(
        { error: 'Invalid billing interval' },
        { status: 400 }
      );
    }
    
    // Validate billing info with basic checks
    const { firstName, lastName, email } = billingInfo;
    
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }
    
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Last name is required' },
        { status: 400 }
      );
    }
    
    if (!email || typeof email !== 'string' || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Authenticate the user
    // 2. Validate the payment data
    // 3. Create a Stripe checkout session
    // 4. Return the session details
    
    // For now, we'll simulate creating a checkout session
    const sessionId = `sess_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock response simulating Stripe checkout session creation
    return NextResponse.json({
      sessionId,
      url: `/checkout/confirmation?session_id=${sessionId}`,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}