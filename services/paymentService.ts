// Mock payment service - in a real implementation, this would connect to Stripe or another payment processor
export interface PaymentData {
  planName: string;
  interval: 'monthly' | 'yearly';
  billingInfo: BillingInfo;
}

export interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
  status: 'pending' | 'completed' | 'failed';
}

/**
 * Creates a checkout session for the selected plan
 */
export async function createCheckoutSession(paymentData: PaymentData): Promise<CheckoutSession> {
  // In a real implementation, this would call your backend API
  // which would create a Stripe checkout session
  
  try {
    // Validate payment data
    if (!isValidPaymentData(paymentData)) {
      throw new Error('Invalid payment data');
    }

    // Simulate API call to backend
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`Payment processing failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Processes a direct payment (alternative to checkout session)
 */
export async function processDirectPayment(paymentData: PaymentData): Promise<{success: boolean, transactionId?: string, error?: string}> {
  try {
    // Validate payment data
    if (!isValidPaymentData(paymentData)) {
      return { success: false, error: 'Invalid payment data' };
    }

    // Simulate API call to backend for direct payment processing
    const response = await fetch('/api/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, transactionId: result.transactionId };
    } else {
      return { success: false, error: result.error || 'Payment processing failed' };
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

/**
 * Validates payment data
 */
function isValidPaymentData(paymentData: PaymentData): boolean {
  const { billingInfo } = paymentData;
  
  // Basic validation checks
  if (!paymentData.planName || !['Free', 'Family', 'Family Plus'].includes(paymentData.planName)) {
    return false;
  }
  
  if (!paymentData.interval || !['monthly', 'yearly'].includes(paymentData.interval)) {
    return false;
  }
  
  if (!billingInfo.firstName.trim() || !billingInfo.lastName.trim()) {
    return false;
  }
  
  if (!billingInfo.email.trim() || !/\S+@\S+\.\S+/.test(billingInfo.email)) {
    return false;
  }
  
  if (!billingInfo.address.trim() || !billingInfo.city.trim() || !billingInfo.postalCode.trim()) {
    return false;
  }
  
  if (!billingInfo.cardNumber.replace(/\s/g, '').match(/^[0-9]{16}$/)) {
    return false;
  }
  
  if (!billingInfo.expiryDate.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
    return false;
  }
  
  if (!billingInfo.cvv.match(/^[0-9]{3,4}$/)) {
    return false;
  }
  
  return true;
}

/**
 * Gets subscription details for a user
 */
export async function getUserSubscription(userId: string): Promise<any> {
  try {
    const response = await fetch(`/api/user/${userId}/subscription`);
    
    if (!response.ok) {
      throw new Error(`Failed to get subscription: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw error;
  }
}

/**
 * Cancels a user's subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/subscription/${subscriptionId}/cancel`, {
      method: 'POST',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

/**
 * Updates a user's subscription plan
 */
export async function updateSubscription(userId: string, newPlan: string, interval: 'monthly' | 'yearly'): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/${userId}/subscription`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: newPlan, interval }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating subscription:', error);
    return false;
  }
}