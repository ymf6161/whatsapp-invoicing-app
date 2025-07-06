const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const StripeService = require('../services/stripe');
const router = express.Router();

// Create checkout session for subscription upgrade
router.post('/subscription/create-checkout', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (req.user.subscription_status === 'paid') {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    const stripeService = new StripeService();
    const result = await stripeService.createCheckoutSession(userId, userEmail);

    if (result.success) {
      res.json({
        sessionId: result.sessionId,
        url: result.url
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription status
router.get('/subscription/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const stripeService = new StripeService();
    const status = await stripeService.getSubscriptionStatus(userId);

    res.json(status);
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel subscription
router.post('/subscription/cancel', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.subscription_status !== 'paid') {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    const stripeService = new StripeService();
    const result = await stripeService.cancelSubscription(userId);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stripe webhook endpoint
router.post('/subscription/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    if (endpointSecret) {
      // Verify webhook signature
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For testing without webhook signature verification
      event = req.body;
    }

    const stripeService = new StripeService();
    const result = await stripeService.handleWebhook(event);

    if (result.success) {
      res.json({ received: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

module.exports = router;

