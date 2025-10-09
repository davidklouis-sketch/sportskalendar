import Stripe from 'stripe';

// Initialize Stripe only if secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  : null;

// Check if Stripe is properly configured
export const isStripeConfigured = () => {
  return !!process.env.STRIPE_SECRET_KEY;
};

// Premium pricing configuration
export const PREMIUM_PRICE_ID = 'price_premium_monthly'; // This will be created in Stripe Dashboard
export const PREMIUM_AMOUNT = 999; // €9.99 in cents
export const PREMIUM_CURRENCY = 'eur';

// Premium features
export const PREMIUM_FEATURES = [
  'Unbegrenzte Teams auswählen',
  'Erweiterte Kalender-Integration',
  'Prioritäts-Support',
  'Exklusive Highlights',
  'Erweiterte Statistiken',
  'Keine Werbung'
];
