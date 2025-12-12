import { configDotenv } from 'dotenv';
import Stripe from 'stripe';
configDotenv()

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';