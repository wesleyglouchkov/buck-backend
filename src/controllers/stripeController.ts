import { Request, Response } from 'express';
import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { db } from '../utils/database';
import { stripe, FRONTEND_URL, STRIPE_WEBHOOK_SECRET } from '../lib/stripe';
import { configDotenv } from 'dotenv';
import { hasOutstandingRequirements, isFullyActive, isOnboardingCompleted } from '../utils/stripeHelper';
configDotenv()

export const createConnectAccountLink = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'CREATOR') return res.status(403).json({ success: false, message: 'User is not a creator' });

    let accountId = user.stripe_account_id as string | undefined;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          product_description: 'BuckCreator',
          mcc: '7997'
        },
        metadata: {
          userId: user.id,
          userEmail: user.email || '',
          userName: user.name || '',
        },
      });

      accountId = account.id;

      await db.user.update({
        where: { id: user.id },
        data: {
          stripe_account_id: accountId,
        },
      });

      logger.info('Created new Stripe Connect account', {
        userId: user.id,
        accountId,
      });
    }

    const account = await stripe.accounts.retrieve(accountId);

    // ✅ Use helper functions
    const fullyActive = isFullyActive(account);
    const hasRequirements = hasOutstandingRequirements(account);

    const linkType = fullyActive ? 'account_update' : 'account_onboarding';
    logger.info('Creating account link', {
      accountId,
      linkType,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      isFullyActive: fullyActive,
      hasOutstandingRequirements: hasRequirements,
      currently_due: account.requirements?.currently_due || [],
      eventually_due: account.requirements?.eventually_due || [],
    });
    // ✅ Use helper for return URL
    const returnUrl = hasRequirements
      ? `${FRONTEND_URL}/creator/stripe/refresh`
      : `${FRONTEND_URL}/creator/stripe/success`;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${FRONTEND_URL}/creator/stripe/refresh`,
      return_url: returnUrl,
      type: linkType,
      collection_options: {
        fields: 'eventually_due',
      },
    });
    return res.json({
      success: true,
      url: accountLink.url,
      accountId,
      linkType,
      hasOutstandingRequirements: hasRequirements,
    });
  } catch (error: any) {
    logger.error('createConnectAccountLink error', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create account link'
    });
  }
};

export const disconnectConnectAccount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'CREATOR') return res.status(403).json({ success: false, message: 'User is not a creator' });

    const accountId = (user as any).stripe_account_id as string | undefined;
    if (!accountId) return res.status(400).json({ success: false, message: 'No Stripe account connected' });

    await stripe.accounts.del(accountId);

    try {
      await db.user.update({
        where: { id: user.id },
        data: {
          stripe_account_id: null,
          stripe_connected: false,
          stripe_onboarding_completed: false,
        },
      });
    } catch (e) {
      logger.warn('DB does not have stripe fields yet; skipping removal of account id');
    }

    return res.json({ success: true, message: 'Stripe account disconnected successfully' });
  } catch (error: any) {
    logger.error('disconnectConnectAccount error', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to disconnect account' });
  }
};

export const getConnectStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const accountId = (user as any).stripe_account_id as string | undefined;
    if (!accountId) {
      return res.json({
        success: true,
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        onboardingCompleted: false,
      });
    }
    const account = await stripe.accounts.retrieve(accountId);

    // ✅ Use helper functions
    const hasRequirements = hasOutstandingRequirements(account);
    const onboardingComplete = isOnboardingCompleted(account);
    logger.info('Stripe account status retrieved', {
      userId,
      accountId,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      hasOutstandingRequirements: hasRequirements,
      isOnboardingCompleted: onboardingComplete,
      currently_due: account.requirements?.currently_due || [],
      eventually_due: account.requirements?.eventually_due || [],
    });
    // ✅ Update database
    await db.user.update({
      where: { id: userId },
      data: {
        stripe_connected: account.charges_enabled || false,
        stripe_onboarding_completed: onboardingComplete,
      },
    });

    return res.json({
      success: true,
      connected: account.charges_enabled || false,
      accountId,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      onboardingCompleted: onboardingComplete,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
        disabled_reason: account.requirements?.disabled_reason,
      },
    });

  } catch (error: any) {
    logger.error('getConnectStatus error', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get status'
    });
  }
};

export const checkAccountStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    if (!user.stripe_account_id) {
      return res.status(404).json({
        success: false,
        message: 'No Stripe account found for this user'
      });
    }

    // Fetch the latest account status directly from Stripe API
    const account = await stripe.accounts.retrieve(user.stripe_account_id);


    // Update the database with the latest status from Stripe
    await db.user.update({
      where: { id: userId },
      data: {
        // @ts-ignore
        stripe_connected: true,
        // @ts-ignore
        stripe_onboarding_completed: account.details_submitted || false,
      },
    });

    // Return the status to frontend
    return res.json({
      success: true,
      data: {
        stripe_connected: true,
        stripe_onboarding_completed: account.details_submitted || false,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
      },
    });
  } catch (error: any) {
    logger.error('checkAccountStatus error', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to check Stripe account status'
    });
  }
};

export const createTipPayment = async (req: Request, res: Response) => {
  try {
    const { creatorId, amount, livestreamId, memberId } = req.body as {
      creatorId?: string;
      amount?: number;
      livestreamId?: string;
      memberId?: string;
    };

    if (!creatorId || !memberId || typeof amount !== 'number') {
      return res.status(400).json({ success: false, message: 'creatorId, memberId and numeric amount are required' });
    }
    if (amount < 1 || amount > 10000) {
      return res.status(400).json({ success: false, message: 'Amount must be between 1 and 10,000 BUCK' });
    }

    const creator = await db.user.findUnique({ where: { id: creatorId } });
    if (!creator) return res.status(404).json({ success: false, message: 'Creator not found' });

    const creatorStripeAccountId = (creator as any).stripe_account_id as string | undefined;
    if (!creatorStripeAccountId) {
      return res.status(400).json({ success: false, message: 'Creator has not connected Stripe' });
    }

    const amountInCents = Math.round(amount * 100);
    const platformFeeAmount = Math.round(amountInCents * 0.10);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tip to Creator',
              description: `${amount} BUCK Coins${livestreamId ? ' during livestream' : ''}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/tip-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/explore`,
      metadata: {
        creatorId,
        memberId,
        livestreamId: livestreamId || '',
        buckAmount: amount.toString(),
        type: 'creator_tip',
      },
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: creatorStripeAccountId,
        },
        metadata: {
          creatorId,
          memberId,
          livestreamId: livestreamId || '',
          buckAmount: amount.toString(),
        },
      },
    });

    // Persist transaction (if table exists)
    try {
      await db.tipTransaction.create({
        data: {
          session_id: session.id,
          creator_id: creatorId,
          member_id: memberId,
          livestream_id: livestreamId || null,
          buck_amount: amount,
          amount_cents: amountInCents,
          platform_fee_cents: platformFeeAmount,
          creator_receives_cents: amountInCents - platformFeeAmount,
          status: 'pending',
          metadata: {},
        },
      });
    } catch (e) {
      logger.warn('Tip transactions table not ready; skipping persist');
    }

    return res.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
  } catch (error: any) {
    logger.error('createTipPayment error', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create tip payment' });
  }
};

// Webhook to handle Stripe events
export const stripeWebhook = async (req: Request, res: Response) => {
  console.log("💫 Received webhook", req.headers);

  const signature = req.headers['stripe-signature'] as string;
  if (!signature) return res.status(400).send('Missing stripe-signature');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).send('Webhook secret not configured');

  let event: Stripe.Event;
  try {
    // req.body is now the raw Buffer thanks to express.raw()
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    console.log("✅ Verified event:", event.type);
  } catch (err: any) {
    logger.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }


  try {
    console.log(event.type, '<-----event.type')
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        try {
          await db.tipTransaction.update({
            where: { session_id: session.id },
            data: {
              status: 'completed',
              completed_at: new Date(),
            },
          });
        } catch { }
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        try {
          await db.tipTransaction.updateMany({
            where: { stripe_payment_intent_id: pi.id },
            data: { status: 'completed', completed_at: new Date() },
          });
        } catch { }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        try {
          await db.tipTransaction.updateMany({
            where: { stripe_payment_intent_id: pi.id },
            data: { status: 'failed' },
          });
        } catch { }
        break;
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const accountId = account.id;
        // ✅ Use helper functions
        const hasRequirements = hasOutstandingRequirements(account);
        const onboardingComplete = isOnboardingCompleted(account);
        logger.info('Stripe account.updated webhook received', {
          accountId,
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          past_due: account.requirements?.past_due || [],
          hasOutstandingRequirements: hasRequirements,
          isOnboardingCompleted: onboardingComplete,
        });
        try {
          const result = await db.user.updateMany({
            where: { stripe_account_id: accountId },
            data: {
              // @ts-ignore
              stripe_connected: account.charges_enabled || false,
              // @ts-ignore
              stripe_onboarding_completed: onboardingComplete,
            },
          });
          logger.info('Successfully updated user from webhook', {
            accountId,
            usersUpdated: result.count,
            stripe_connected: account.charges_enabled,
            stripe_onboarding_completed: onboardingComplete,
          });
          if (hasRequirements) {
            logger.warn('Account has outstanding requirements', {
              accountId,
              currently_due: account?.requirements?.currently_due,
              eventually_due: account?.requirements?.eventually_due,
            });
          }
        } 
        catch (error) {
          logger.error('Failed to update user from account.updated webhook', {
            accountId,
            error,
          });
        }
        break;
      }
      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error('stripeWebhook error', error);
    return res.status(500).send('Webhook handler error');
  }
};
