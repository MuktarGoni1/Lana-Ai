import { NextRequest, NextResponse } from 'next/server';
import { validatePaymentInputs, type SecureBillingInfo } from '@/lib/securePaymentHandler';

// Mock function to simulate Paddle integration
// Replace with actual Paddle API calls after account setup
async function createPaddlePaymentIntent(
  amount: number,
  currency: string,
  billingInfo: SecureBillingInfo
): Promise<{ success: boolean; clientSecret?: string; paymentId?: string; error?: string }> {
  try {
    // In a real implementation, this would call Paddle's API
    // For now, we simulate a successful response
    
    // Validate the inputs (this should be done before calling external APIs)
    if (!validatePaymentInputs(amount, currency, billingInfo)) {
      return {
        success: false,
        error: 'Invalid payment information'
      };
    }

    // Simulate Paddle API call
    const paymentId = `pdl_${Math.random().toString(36).substr(2, 16)}`;
    const clientSecret = `secret_${Math.random().toString(36).substr(2, 32)}`;

    // In a real implementation:
    // const paddleResponse = await fetch('https://api.paddle.com/transactions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     items: [{
    //       priceId: getPriceIdForPlan(amount, currency),
    //       quantity: 1
    //     }],
    //     customer: {
    //       email: billingInfo.email,
    //       name: `${billingInfo.firstName} ${billingInfo.lastName}`
    //     },
    //     customData: {
    //       ...billingInfo
    //     }
    //   })
    // });

    return {
      success: true,
      clientSecret,
      paymentId
    };
  } catch (error) {
    console.error('Paddle payment intent error:', error);
    return {
      success: false,
      error: 'Payment processing failed'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (basic implementation)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    // In production, implement proper rate limiting with Redis or similar
    
    const { amount, currency = 'usd', billingInfo } = await request.json();

    // Validate required fields
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (typeof currency !== 'string' || currency.length > 3) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      );
    }

    if (!billingInfo || typeof billingInfo !== 'object') {
      return NextResponse.json(
        { error: 'Missing billing information' },
        { status: 400 }
      );
    }

    // Validate billing info (secure version without card data)
    const { firstName, lastName, email, address, city, postalCode, country } = billingInfo as SecureBillingInfo;

    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0 || firstName.trim().length > 50) {
      return NextResponse.json(
        { error: 'Valid first name is required (1-50 characters)' },
        { status: 400 }
      );
    }

    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0 || lastName.trim().length > 50) {
      return NextResponse.json(
        { error: 'Valid last name is required (1-50 characters)' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^[\w.-]+@([\w-]+\.)+[\w-]{2,}$/.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!address || typeof address !== 'string' || address.trim().length === 0 || address.trim().length > 200) {
      return NextResponse.json(
        { error: 'Valid address is required (1-200 characters)' },
        { status: 400 }
      );
    }

    if (!city || typeof city !== 'string' || city.trim().length === 0 || city.trim().length > 100) {
      return NextResponse.json(
        { error: 'Valid city is required (1-100 characters)' },
        { status: 400 }
      );
    }

    if (!postalCode || typeof postalCode !== 'string' || postalCode.trim().length === 0 || postalCode.trim().length > 20) {
      return NextResponse.json(
        { error: 'Valid postal code is required (1-20 characters)' },
        { status: 400 }
      );
    }

    if (country && (typeof country !== 'string' || country.trim().length > 100)) {
      return NextResponse.json(
        { error: 'Valid country is required (1-100 characters)' },
        { status: 400 }
      );
    }

    // Create payment intent with Paddle
    const result = await createPaddlePaymentIntent(amount, currency, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      country: country?.trim() || 'Nigeria'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Payment processing failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentId: result.paymentId,
      message: 'Payment intent created successfully'
    });
  } catch (error) {
    console.error('Error creating secure payment intent:', error);
    
    // Return a generic error message to avoid exposing internal details
    return NextResponse.json(
      { error: 'Failed to process payment request' },
      { status: 500 }
    );
  }
}