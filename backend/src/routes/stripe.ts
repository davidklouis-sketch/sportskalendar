import express, { Router, Request, Response } from 'express';
import { z } from 'zod';
import { stripe, PREMIUM_AMOUNT, PREMIUM_CURRENCY, PREMIUM_PRICE_ID, isStripeConfigured } from '../config/stripe';
import { requireAuth } from '../middleware/auth';
import { UserRepository } from '../database/repositories/userRepository';

export const stripeRouter = Router();

// Webhook handler (exported separately to be registered with raw body parser)
export async function handleStripeWebhook(req: Request, res: Response) {
  // Check if Stripe is configured
  if (!isStripeConfigured() || !stripe) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Payment processing is currently unavailable'
    });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Use raw body for signature verification (body is already raw from app-level middleware)
    event = stripe!.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    console.log(`🔍 Processing Stripe webhook event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        console.log(`🔍 Checkout session completed:`, {
          id: session.id,
          metadata: session.metadata,
          customer_email: session.customer_email,
          payment_status: session.payment_status
        });
        
        const userEmail = session.metadata?.userEmail || session.customer_email;
        
        if (userEmail) {
          console.log(`🔍 Attempting to upgrade user to premium: ${userEmail}`);
          const result = await UserRepository.updateByEmail(userEmail, { isPremium: true });
          console.log(`✅ User ${userEmail} upgraded to premium via Stripe. Result:`, result);
        } else {
          console.log(`❌ No user email found in session metadata or customer_email`);
        }
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object as any;
        const customerEmail = subscription.metadata?.userEmail;
        
        if (customerEmail) {
          // Downgrade user from premium
          await UserRepository.updateByEmail(customerEmail, { isPremium: false });
          console.log(`❌ User ${customerEmail} downgraded from premium via Stripe`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Debug endpoint to check Stripe configuration
stripeRouter.get('/debug', (req, res) => {
  // Show all environment variables that start with STRIPE
  const stripeEnvVars = Object.keys(process.env)
    .filter(key => key.startsWith('STRIPE'))
    .reduce((obj, key) => {
      obj[key] = process.env[key] ? 'SET' : 'NOT_SET';
      return obj;
    }, {} as Record<string, string>);

  res.json({
    isStripeConfigured: isStripeConfigured(),
    hasStripeInstance: !!stripe,
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasPriceId: !!process.env.STRIPE_PRICE_ID,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...' || 'undefined',
    priceId: process.env.STRIPE_PRICE_ID || 'undefined',
    allStripeEnvVars: stripeEnvVars,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('STRIPE') || key.includes('stripe'))
  });
});

// Debug endpoint to check user premium status
stripeRouter.get('/debug/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await UserRepository.findByEmail(email);
    
    res.json({
      email,
      userFound: !!user,
      isPremium: user?.isPremium || false,
      userData: user ? {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isPremium: user.isPremium,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      } : null
    });
  } catch (error) {
    console.error('Debug user lookup failed:', error);
    res.status(500).json({ error: 'Failed to lookup user' });
  }
});

// Create Stripe checkout session
stripeRouter.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured() || !stripe) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Payment processing is currently unavailable'
      });
    }

    const user = (req as any).user as { id: string; email: string };
    
    // Check if user is already premium
    const userRecord = await UserRepository.findByEmail(user.email);
    if (userRecord?.isPremium) {
      return res.status(400).json({
        error: 'Already premium',
        message: 'User is already a premium member'
      });
    }

    // Create Stripe checkout session
    const session = await stripe!.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PREMIUM_PRICE_ID, // Use the price ID from Stripe Dashboard
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'https://sportskalendar.de'}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://sportskalendar.de'}/premium/cancel`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        userEmail: user.email,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    res.status(500).json({
      error: 'Checkout session creation failed',
      message: 'Unable to create payment session'
    });
  }
});

// Note: The webhook handler is registered separately in index.ts with raw body parser
// This route is here for documentation purposes but won't be used
// The actual webhook is handled by the exported handleStripeWebhook function

// Get premium features info
stripeRouter.get('/premium-features', (req, res) => {
  res.json({
    features: [
      'Unbegrenzte Teams auswählen',
      'Erweiterte Kalender-Integration', 
      'Prioritäts-Support',
      'Exklusive Highlights',
      'Erweiterte Statistiken',
      'Keine Werbung'
    ],
    price: {
      amount: PREMIUM_AMOUNT,
      currency: PREMIUM_CURRENCY,
      formatted: `€${(PREMIUM_AMOUNT / 100).toFixed(2)}/Monat`
    }
  });
});

// Manual premium upgrade (admin only)
stripeRouter.post('/admin/upgrade-user', requireAuth, async (req, res) => {
  try {
    const adminUser = (req as any).user as { id: string; email: string; role?: string };
    
    // Check if user is admin
    if (adminUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can upgrade users'
      });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'User email is required'
      });
    }

    // Find and upgrade user
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with this email'
      });
    }

    await UserRepository.updateByEmail(email, { isPremium: true });
    
    console.log(`✅ Admin ${adminUser.email} manually upgraded user ${email} to premium`);
    
    res.json({
      success: true,
      message: `User ${email} has been upgraded to premium`,
      user: {
        email: user.email,
        displayName: user.displayName,
        isPremium: true
      }
    });
  } catch (error) {
    console.error('Manual premium upgrade failed:', error);
    res.status(500).json({
      error: 'Upgrade failed',
      message: 'Unable to upgrade user to premium'
    });
  }
});

// Manual premium downgrade (admin only)
stripeRouter.post('/admin/downgrade-user', requireAuth, async (req, res) => {
  try {
    const adminUser = (req as any).user as { id: string; email: string; role?: string };
    
    // Check if user is admin
    if (adminUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can downgrade users'
      });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'User email is required'
      });
    }

    // Find and downgrade user
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with this email'
      });
    }

    await UserRepository.updateByEmail(email, { isPremium: false });
    
    console.log(`❌ Admin ${adminUser.email} manually downgraded user ${email} from premium`);
    
    res.json({
      success: true,
      message: `User ${email} has been downgraded from premium`,
      user: {
        email: user.email,
        displayName: user.displayName,
        isPremium: false
      }
    });
  } catch (error) {
    console.error('Manual premium downgrade failed:', error);
    res.status(500).json({
      error: 'Downgrade failed',
      message: 'Unable to downgrade user from premium'
    });
  }
});
