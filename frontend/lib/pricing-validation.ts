// Shared validation utilities for pricing operations
import { PRICING_CONFIG, PlanName, BillingInterval, isValidPlan, isValidInterval } from './pricing-config';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates plan selection parameters
 */
export function validatePlanSelection(planName: string, interval: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate plan name
  if (!planName || typeof planName !== 'string') {
    errors.push({ field: 'plan', message: 'Plan name is required' });
  } else if (!isValidPlan(planName)) {
    errors.push({ field: 'plan', message: 'Invalid plan selected' });
  }

  // Validate interval
  if (!interval || typeof interval !== 'string') {
    errors.push({ field: 'interval', message: 'Billing interval is required' });
  } else if (!isValidInterval(interval)) {
    errors.push({ field: 'interval', message: 'Invalid billing interval selected' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Safely decodes and validates URL parameters
 */
export function sanitizePlanParameters(planName: string | null, interval: string | null): { 
  planName: PlanName; 
  interval: BillingInterval 
} | null {
  try {
    if (!planName || !interval) {
      return null;
    }

    // Decode URI components safely
    const decodedPlan = decodeURIComponent(planName).trim();
    const decodedInterval = decodeURIComponent(interval).trim();

    // Validate against allowed values
    if (!isValidPlan(decodedPlan)) {
      throw new Error('Invalid plan parameter');
    }

    if (!isValidInterval(decodedInterval)) {
      throw new Error('Invalid interval parameter');
    }

    return { 
      planName: decodedPlan as PlanName, 
      interval: decodedInterval as BillingInterval 
    };
  } catch (error) {
    console.error('Error sanitizing plan parameters:', error);
    return null;
  }
}

/**
 * Validates that a plan is allowed for the current context
 */
export function isAllowedPlan(planName: PlanName, context: 'display' | 'checkout' | 'upgrade'): boolean {
  switch (context) {
    case 'display':
      // All plans can be displayed
      return true;
    case 'checkout':
      // All plans can be checked out (including Free)
      return true;
    case 'upgrade':
      // Only paid plans can be upgraded to
      return planName !== 'Free';
    default:
      return false;
  }
}

/**
 * Gets the appropriate redirect URL for a plan
 */
export function getPlanRedirectUrl(planName: PlanName, interval: BillingInterval, isAuthenticated: boolean): string {
  if (!isAuthenticated) {
    return '/register';
  }

  switch (planName) {
    case 'Free':
      return '/homepage';
    case 'Family':
    case 'Family Plus':
      return `/checkout?plan=${encodeURIComponent(planName)}&interval=${encodeURIComponent(interval)}`;
    default:
      return '/pricing';
  }
}

/**
 * Validates payment data structure
 */
export function isValidPaymentData(paymentData: any): boolean {
  if (!paymentData || typeof paymentData !== 'object') {
    return false;
  }

  const { planName, interval, billingInfo } = paymentData;

  // Validate plan and interval
  const planValidation = validatePlanSelection(planName, interval);
  if (!planValidation.isValid) {
    return false;
  }

  // For paid plans, validate billing information
  if (planName !== 'Free') {
    if (!billingInfo || typeof billingInfo !== 'object') {
      return false;
    }

    const { firstName, lastName, email, cardNumber, expiryDate, cvv } = billingInfo;

    // Basic required field validation
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return false;
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return false;
    }

    // Card information validation
    if (!cardNumber?.replace(/\s/g, '').match(/^\d{16}$/)) {
      return false;
    }

    if (!expiryDate?.match(/^(0[1-9]|1[0-2])\/?(\d{2})$/)) {
      return false;
    }

    if (!cvv?.match(/^\d{3,4}$/)) {
      return false;
    }
  }

  return true;
}