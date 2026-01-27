// lib/securePaymentHandler.ts
// Define a secure billing info type without card data
export interface SecureBillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

/**
 * Securely handles payment data without exposing sensitive information
 * This acts as a bridge between the frontend form and the payment provider
 */

interface PaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  paymentId?: string;
  error?: string;
}

/**
 * Creates a payment intent with the backend
 * This is where you'll integrate with Paddle after setting up your account
 */
export async function createSecurePaymentIntent(
  amount: number,
  currency: string,
  billingInfo: SecureBillingInfo
): Promise<PaymentIntentResponse> {
  try {
    // Validate inputs before sending to backend
    if (!validatePaymentInputs(amount, currency, billingInfo)) {
      return {
        success: false,
        error: "Invalid payment information"
      };
    }

    // In a real implementation, this would call your Paddle integration
    // For now, we'll simulate a secure backend call
    const response = await fetch("/api/create-secure-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add CSRF token here
        "X-CSRF-Token": await getCSRFToken()
      },
      body: JSON.stringify({
        amount,
        currency,
        billingInfo: {
          firstName: billingInfo.firstName.trim(),
          lastName: billingInfo.lastName.trim(),
          email: billingInfo.email.trim(),
          address: billingInfo.address.trim(),
          city: billingInfo.city.trim(),
          postalCode: billingInfo.postalCode.trim(),
          country: billingInfo.country || "Nigeria"
          // Note: NO card data is sent here
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Payment processing failed"
      };
    }

    const data = await response.json();
    return {
      success: true,
      clientSecret: data.clientSecret,
      paymentId: data.paymentId
    };
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return {
      success: false,
      error: "Network error occurred"
    };
  }
}

/**
 * Validates payment inputs securely
 */
export function validatePaymentInputs(
  amount: number,
  currency: string,
  billingInfo: SecureBillingInfo
): boolean {
  // Amount validation
  if (typeof amount !== "number" || amount <= 0 || amount > 999999) {
    return false;
  }

  // Currency validation
  const validCurrencies = ["usd", "eur", "gbp", "ngn"];
  if (!validCurrencies.includes(currency.toLowerCase())) {
    return false;
  }

  // Billing info validation
  const { firstName, lastName, email, address, city, postalCode } = billingInfo;

  if (
    !firstName?.trim() ||
    !lastName?.trim() ||
    !email?.trim() ||
    !address?.trim() ||
    !city?.trim() ||
    !postalCode?.trim()
  ) {
    return false;
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return false;
  }

  return true;
}

/**
 * Gets CSRF token for secure requests
 * In a real implementation, this would fetch from your CSRF endpoint
 */
async function getCSRFToken(): Promise<string> {
  try {
    const response = await fetch("/api/csrf-token");
    if (!response.ok) return "default-token";
    const data = await response.json();
    return data.token || "default-token";
  } catch {
    return "default-token";
  }
}

/**
 * Mock function for Paddle integration
 * Replace this with actual Paddle.js integration after account setup
 */
export async function initializePaddle(): Promise<void> {
  // This will be replaced with actual Paddle initialization
  // Example: await loadPaddleScript();
  console.log("Paddle integration will be initialized here");
}

/**
 * Mock function for creating Paddle checkout
 * Replace this with actual Paddle checkout creation
 */
export async function createPaddleCheckout(
  productId: string,
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
  }
): Promise<void> {
  // This will be replaced with actual Paddle checkout
  console.log("Paddle checkout will be created here", {
    productId,
    customerInfo
  });
}