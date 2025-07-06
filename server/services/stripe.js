const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class StripeService {
  constructor() {
    this.stripe = stripe;
  }

  async createCheckoutSession(userId, userEmail, priceId = 'price_1234567890') {
    try {
      // Create or get Stripe customer
      const customer = await this.getOrCreateCustomer(userId, userEmail);

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'WhatsApp Invoicing Pro',
                description: 'Unlimited invoices, QuickBooks sync, and premium features',
              },
              unit_amount: 2900, // $29.00 in cents
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?success=true`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription?canceled=true`,
        metadata: {
          userId: userId,
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getOrCreateCustomer(userId, email) {
    try {
      // Check if customer already exists in Stripe
      const existingCustomers = await this.stripe.customers.list({
        email: email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: email,
        metadata: {
          userId: userId
        }
      });

      return customer;
    } catch (error) {
      console.error('Error getting/creating customer:', error);
      throw error;
    }
  }

  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      return { success: false, error: error.message };
    }
  }

  async handleCheckoutCompleted(session) {
    try {
      const userId = session.metadata.userId;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      // Update user subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: 'paid',
          renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .eq('id', userId);

      // Store subscription details
      await supabase
        .from('integrations')
        .upsert([
          {
            user_id: userId,
            integration_name: 'stripe_subscription',
            access_token: subscriptionId,
            refresh_token: customerId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);

      console.log(`Subscription activated for user ${userId}`);
    } catch (error) {
      console.error('Error handling checkout completed:', error);
      throw error;
    }
  }

  async handleSubscriptionUpdated(subscription) {
    try {
      const customerId = subscription.customer;
      
      // Find user by customer ID
      const { data: integration, error } = await supabase
        .from('integrations')
        .select('user_id')
        .eq('integration_name', 'stripe_subscription')
        .eq('refresh_token', customerId)
        .single();

      if (error || !integration) {
        console.log('User not found for subscription update');
        return;
      }

      const status = subscription.status === 'active' ? 'paid' : 'free';
      const renewalDate = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      await supabase
        .from('users')
        .update({
          subscription_status: status,
          renewal_date: renewalDate
        })
        .eq('id', integration.user_id);

      console.log(`Subscription updated for user ${integration.user_id}: ${status}`);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  async handleSubscriptionDeleted(subscription) {
    try {
      const customerId = subscription.customer;
      
      // Find user by customer ID
      const { data: integration, error } = await supabase
        .from('integrations')
        .select('user_id')
        .eq('integration_name', 'stripe_subscription')
        .eq('refresh_token', customerId)
        .single();

      if (error || !integration) {
        console.log('User not found for subscription deletion');
        return;
      }

      await supabase
        .from('users')
        .update({
          subscription_status: 'free',
          renewal_date: null
        })
        .eq('id', integration.user_id);

      console.log(`Subscription canceled for user ${integration.user_id}`);
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
      throw error;
    }
  }

  async handlePaymentSucceeded(invoice) {
    try {
      const subscriptionId = invoice.subscription;
      
      if (subscriptionId) {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        await this.handleSubscriptionUpdated(subscription);
      }
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
      throw error;
    }
  }

  async handlePaymentFailed(invoice) {
    try {
      const customerId = invoice.customer;
      
      // Find user by customer ID
      const { data: integration, error } = await supabase
        .from('integrations')
        .select('user_id')
        .eq('integration_name', 'stripe_subscription')
        .eq('refresh_token', customerId)
        .single();

      if (error || !integration) {
        console.log('User not found for payment failure');
        return;
      }

      // Log payment failure
      await supabase
        .from('bot_logs')
        .insert([
          {
            user_id: integration.user_id,
            log_type: 'payment_failed',
            message: `Payment failed for invoice ${invoice.id}`
          }
        ]);

      console.log(`Payment failed for user ${integration.user_id}`);
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('subscription_status, renewal_date')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return {
        subscription_status: user.subscription_status,
        renewal_date: user.renewal_date,
        is_active: user.subscription_status === 'paid'
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  async cancelSubscription(userId) {
    try {
      // Get subscription details
      const { data: integration, error } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('user_id', userId)
        .eq('integration_name', 'stripe_subscription')
        .single();

      if (error || !integration) {
        throw new Error('Subscription not found');
      }

      // Cancel subscription in Stripe
      await this.stripe.subscriptions.update(integration.access_token, {
        cancel_at_period_end: true
      });

      return {
        success: true,
        message: 'Subscription will be canceled at the end of the current billing period'
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = StripeService;

