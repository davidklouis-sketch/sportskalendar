import { Router } from 'express';
import { z } from 'zod';
import { stripe, PREMIUM_AMOUNT, PREMIUM_CURRENCY, PREMIUM_PRICE_ID, isStripeConfigured } from '../config/stripe';
import { requireAuth } from '../middleware/auth';
import { UserRepository } from '../database/repositories/userRepository';

export const stripeRouter = Router();

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

// Handle successful payment (webhook)
stripeRouter.post('/webhook', async (req, res) => {
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
    event = stripe!.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        const userEmail = session.metadata?.userEmail;
        
        if (userEmail) {
          // Upgrade user to premium
          await UserRepository.updateByEmail(userEmail, { isPremium: true });
          console.log(`✅ User ${userEmail} upgraded to premium via Stripe`);
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
});

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
