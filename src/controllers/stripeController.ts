import { Request, Response } from 'express';
import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { db } from '../utils/database';
import { stripe, FRONTEND_URL, STRIPE_WEBHOOK_SECRET } from '../lib/stripe';
import { configDotenv } from 'dotenv';
configDotenv()

export const createConnectAccountLink = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'CREATOR') return res.status(403).json({ success: false, message: 'User is not a creator' });

    // Create or reuse existing Stripe account
    let accountId = user.stripe_account_id as string | undefined;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        // country: 'US',
        email: user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId: user.id,
          userEmail: user.email || '',
          userName: user.name || '',
        },
      });
      accountId = account.id;

      // Persist account id
      try {
        await db.user.update({
          where: { id: user.id },
          data: {
            stripe_account_id: accountId,
            stripe_connected: true,
          },
        });
      } catch (e) {
        logger.warn('DB does not have stripe fields yet; skipping persist of account id');
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${FRONTEND_URL}/creator/profile?stripe_refresh=true`,
      return_url: `${FRONTEND_URL}/creator/profile?stripe_connected=true`,
      type: 'account_onboarding',
    });
    return res.json({ success: true, url: accountLink.url, accountId });
  } catch (error: any) {
    logger.error('createConnectAccountLink error', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create account link' });
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
          // @ts-ignore
          stripe_account_id: null,
          // @ts-ignore
          stripe_connected: false,
          // @ts-ignore
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
    if (!accountId) return res.json({ success: true, connected: false });

    const account = await stripe.accounts.retrieve(accountId);
    return res.json({
      success: true,
      connected: true,
      accountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error: any) {
    logger.error('getConnectStatus error', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to get status' });
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
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) return res.status(400).send('Missing stripe-signature');
    if (!STRIPE_WEBHOOK_SECRET) return res.status(500).send('Webhook secret not configured');
    if (!req.rawBody) return res.status(400).send('Missing raw body');

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature as string, STRIPE_WEBHOOK_SECRET);
      console.log("⚽️", event)
    } catch (err: any) {
      logger.error('Webhook signature verification failed', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

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
        console.log(account.details_submitted, '<-------Details submitted')
        const accountId = account.id;
        try {
          await db.user.updateMany({
            where: { stripe_account_id: accountId },
            data: {
              // @ts-ignore
              stripe_connected: true,
              // @ts-ignore
              stripe_onboarding_completed: account.details_submitted,
            },
          });
        } catch { }
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error('stripeWebhook error', error);
    return res.status(500).send('Webhook handler error');
  }
};
