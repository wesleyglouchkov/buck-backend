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
