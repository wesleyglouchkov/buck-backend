import { Prisma } from '@prisma/client';

/**
 * Calculate total revenue for a creator from tips and subscriptions
 * @param tipTransactions - Array of completed tip transactions with creator_receives_cents
 * @param subscriptions - Array of active subscriptions with fee (Decimal)
 * @returns Total revenue in dollars
 */
export const calculateCreatorRevenue = (
    tipTransactions: { creator_receives_cents: number }[],
    subscriptions: { fee: Prisma.Decimal }[]
): number => {
    // Sum up all completed tip transactions (creator_receives_cents)
    const totalTipRevenueCents = tipTransactions.reduce(
        (sum, transaction) => sum + transaction.creator_receives_cents,
        0
    );

    // Sum up all active subscription fees (convert Decimal to number)
    const totalSubscriptionRevenue = subscriptions.reduce(
        (sum, subscription) => sum + subscription.fee.toNumber(),
        0
    );

    // Convert tip cents to dollars and add subscription revenue
    return (totalTipRevenueCents / 100) + totalSubscriptionRevenue;
};

/**
 * Calculate total platform revenue from aggregated tip and subscription data
 * @param totalTipCents - Total value of creator_receives_cents from all completed tips
 * @param totalSubscriptionFees - Total value of all active subscription fees
 * @returns Total revenue in dollars
 */
export const calculateTotalPlatformRevenue = (totalTipCents: number, totalSubscriptionFees: number | Prisma.Decimal): number => {
    const subscriptionRevenue = typeof totalSubscriptionFees === 'number' ? totalSubscriptionFees : totalSubscriptionFees.toNumber();

    return (totalTipCents / 100) + subscriptionRevenue;
};

/**
 * Calculate average revenue per creator
 * @param totalRevenue - Total calculated revenue in dollars
 * @param activeCreatorCount - Number of active creators
 * @returns Average revenue per creator in dollars
 */
export const calculateAverageCreatorRevenue = (totalRevenue: number,  activeCreatorCount: number): number => {
    if (activeCreatorCount === 0) return 0;
    return Number((totalRevenue / activeCreatorCount).toFixed(2));
};
