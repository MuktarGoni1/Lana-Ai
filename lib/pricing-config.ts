// Centralized pricing configuration for the entire application
export const PRICING_CONFIG = {
  plans: {
    'Free': { 
      monthly: 0, 
      yearly: 0,
      features: ["Unlimited lessons", "Adaptive AI", "Progress tracking", "Mobile & desktop"],
      description: "Perfect for individual learners"
    },
    'Family': { 
      monthly: 6, 
      yearly: 5,
      features: ["Up to 2 students", "Parent dashboard", "Real-time reports", "Push notifications"],
      description: "Connect parent and student"
    },
    'Family Plus': { 
      monthly: 35, 
      yearly: 29,
      features: ["Up to 5 students", "Advanced analytics", "Weekly summaries", "Priority support"],
      description: "For larger families"
    }
  },
  allowedPlans: ['Free', 'Family', 'Family Plus'],
  allowedIntervals: ['monthly', 'yearly'],
  discountRates: {
    'Family': 17, // 17% discount
    'Family Plus': 17 // 17% discount
  }
} as const;

// Type definitions
export type PlanName = keyof typeof PRICING_CONFIG.plans;
export type BillingInterval = typeof PRICING_CONFIG.allowedIntervals[number];

// Utility functions
export function getPlanPrice(planName: PlanName, interval: BillingInterval): number {
  return PRICING_CONFIG.plans[planName][interval];
}

export function getPlanFeatures(planName: PlanName): readonly string[] {
  return PRICING_CONFIG.plans[planName].features;
}

export function getPlanDescription(planName: PlanName): string {
  return PRICING_CONFIG.plans[planName].description;
}

export function isValidPlan(planName: string): planName is PlanName {
  return PRICING_CONFIG.allowedPlans.includes(planName as PlanName);
}

export function isValidInterval(interval: string): interval is BillingInterval {
  return PRICING_CONFIG.allowedIntervals.includes(interval as BillingInterval);
}

export function calculateAnnualSavings(planName: PlanName): number {
  if (planName === 'Free') return 0;
  
  const monthlyPrice = PRICING_CONFIG.plans[planName].monthly;
  const yearlyPrice = PRICING_CONFIG.plans[planName].yearly;
  const monthlyTotal = monthlyPrice * 12;
  return monthlyTotal - yearlyPrice;
}