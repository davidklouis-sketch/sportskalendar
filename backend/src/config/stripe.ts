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
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_your_webhook_secret_here';
  const hasPriceId = !!process.env.STRIPE_PRICE_ID && process.env.STRIPE_PRICE_ID !== 'price_your_stripe_price_id_here' && process.env.STRIPE_PRICE_ID !== '***';
  
  console.log('🔍 Stripe configuration check:', {
    hasSecretKey,
    hasWebhookSecret,
    hasPriceId,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...' || 'undefined',
    webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...' || 'undefined',
    priceId: process.env.STRIPE_PRICE_ID || 'undefined',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('STRIPE')),
    isSecretKeyPlaceholder: process.env.STRIPE_SECRET_KEY === 'sk_live_your_stripe_secret_key_here',
    isPriceIdPlaceholder: process.env.STRIPE_PRICE_ID === 'price_your_stripe_price_id_here' || process.env.STRIPE_PRICE_ID === '***'
  });
  
  // Return true only if all required keys are set
  const isConfigured = hasSecretKey && hasWebhookSecret && hasPriceId;
  console.log(`🔍 Stripe is ${isConfigured ? 'CONFIGURED ✅' : 'NOT CONFIGURED ❌'}`);
  
  return isConfigured;
};

// Premium pricing configuration
export const PREMIUM_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_premium_monthly';
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
