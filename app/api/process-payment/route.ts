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
    
    // Validate billing info with more detailed checks
    const { firstName, lastName, email, address, city, postalCode, cardNumber, expiryDate, cvv } = billingInfo;
    
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
    
    if (!email || typeof email !== 'string' || !/^[\w.-]+@([\w-]+\.)+[\w-]{2,}$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }
    
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }
    
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return NextResponse.json(
        { error: 'City is required' },
        { status: 400 }
      );
    }
    
    if (!postalCode || typeof postalCode !== 'string' || postalCode.trim().length === 0) {
      return NextResponse.json(
        { error: 'Postal code is required' },
        { status: 400 }
      );
    }
    
    // For non-Free plans, validate payment information
    if (sanitizedPlanName !== 'Free') {
      if (!cardNumber || typeof cardNumber !== 'string' || !/^\d{16}$|^\d{4} \d{4} \d{4} \d{4}$/.test(cardNumber.replace(/\s/g, ''))) {
        return NextResponse.json(
          { error: 'Valid card number is required' },
          { status: 400 }
        );
      }
      
      if (!expiryDate || typeof expiryDate !== 'string' || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        return NextResponse.json(
          { error: 'Valid expiry date is required (MM/YY)' },
          { status: 400 }
        );
      }
      
      if (!cvv || typeof cvv !== 'string' || !/^\d{3,4}$/.test(cvv)) {
        return NextResponse.json(
          { error: 'Valid CVV is required' },
          { status: 400 }
        );
      }
    }

    // In a real implementation, you would:
    // 1. Authenticate the user
    // 2. Validate the payment data
    // 3. Process payment with Stripe
    // 4. Update user subscription in database
    // 5. Return transaction details
    
    // For now, we'll simulate processing a payment
    const transactionId = `txn_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock response simulating successful payment processing
    return NextResponse.json({
      success: true,
      transactionId,
      message: 'Payment processed successfully',
      plan: planName,
      interval
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}