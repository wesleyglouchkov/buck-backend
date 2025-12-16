import Stripe from 'stripe';

export const hasOutstandingRequirements = (account: Stripe.Account): boolean => {
  return !!(
    (account.requirements?.currently_due && account.requirements.currently_due.length > 0) ||
    (account.requirements?.eventually_due && account.requirements.eventually_due.length > 0) ||
    (account.requirements?.past_due && account.requirements.past_due.length > 0)
  );
};

// ✅ SIMPLIFIED: Onboarding is complete when charges AND payouts are enabled, and no requirements
export const isOnboardingCompleted = (account: Stripe.Account): boolean => {
  return (
    account.charges_enabled === true &&
    account.payouts_enabled === true &&  // ← This is the key field
    !hasOutstandingRequirements(account)
  );
};

export const isFullyActive = (account: Stripe.Account): boolean => {
  return account.charges_enabled === true && account.payouts_enabled === true;
};