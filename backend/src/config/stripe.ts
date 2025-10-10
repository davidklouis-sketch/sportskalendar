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
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_live_your_stripe_secret_key_here';
  console.log('🔍 Stripe configuration check:', {
    hasSecretKey,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...' || 'undefined',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('STRIPE')),
    isPlaceholder: process.env.STRIPE_SECRET_KEY === 'sk_live_your_stripe_secret_key_here'
  });
  return hasSecretKey;
};

// Premium pricing configuration
export const PREMIUM_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_premium_monthly'; // Set in environment variables
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
