const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const programAssignmentService = require('./programAssignmentService');

// Plan configuration matching Payhip products
const PLAN_CONFIG = {
  foundations: {
    name: 'Foundations',
    monthlyPrice: 12,
    yearlyPrice: 120,
    features: ['Exercise Videos', 'Progress Tracking', 'Community Access']
  },
  advanced: {
    name: 'Advanced Accelerator',
    monthlyPrice: 25,
    yearlyPrice: 250,
    features: ['All Foundations', 'Custom Plans', 'Weekly Check-ins']
  },
  custom: {
    name: 'Custom Coaching',
    monthlyPrice: 50,
    yearlyPrice: 500,
    features: ['All Advanced', 'Personal Trainer', 'Daily Check-ins']
  }
};

class SubscriptionService {
  /**
   * Create or update subscription from Payhip webhook
   */
  async handlePaidEvent(webhookData) {
    try {
      const { 
        email,
        first_name,
        last_name,
        product_id,
        id,
        price,
        currency,
        pricing_plan_id,
        payment_type
      } = webhookData;

      // Find user by email (try exact match first, then variations)
      let user = await User.findOne({ email: email.toLowerCase() });
      
      // If not found, try common email variations and similar emails
      if (!user) {
        // Try with different common variations
        const emailVariations = [
          email.toLowerCase(),
          email.toLowerCase().replace(/\./g, ''), // Remove dots
          email.toLowerCase().replace(/[._]/g, ''), // Remove dots and underscores
        ];
        
        // Also try common typos (s/z variations)
        if (email.includes('axis')) {
          emailVariations.push(email.toLowerCase().replace('axis', 'axiz'));
        }
        if (email.includes('axiz')) {
          emailVariations.push(email.toLowerCase().replace('axiz', 'axis'));
        }
        
        for (const variation of emailVariations) {
          user = await User.findOne({ 
            $or: [
              { email: variation },
              { googleEmail: variation }
            ]
          });
          if (user) {
            console.log(`✅ Found user with email variation: ${variation} (original: ${email})`);
            break;
          }
        }
      }
      
      if (!user) {
        console.log(`⚠️ User not found with email: ${email}`);
        console.log(`🔍 Searched variations: ${email.toLowerCase()}`);
        throw new Error(`User not found with email: ${email}`);
      }

      // Determine plan from product_id or amount
      const plan = this.getPlanFromProductOrAmount(product_id, price);
      const billingCycle = this.getBillingCycleFromAmount(plan, price);

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Update user subscription
      user.subscription.plan = plan;
      user.subscription.status = 'active';
      user.subscription.startDate = startDate;
      user.subscription.endDate = endDate;
      user.subscription.payhipCustomerId = email;
      user.subscription.payhipSubscriptionId = pricing_plan_id;
      user.subscription.payhipProductId = product_id;
      user.subscription.currentPeriodStart = startDate;
      user.subscription.currentPeriodEnd = endDate;
      user.subscription.cancelAtPeriodEnd = false;

      await user.save();

      // Create or update subscription record
      let subscription = await Subscription.findOne({ 
        user: user._id, 
        payhipSubscriptionId: pricing_plan_id 
      });

      if (!subscription) {
        subscription = new Subscription({
          user: user._id,
          plan: plan,
          status: 'active',
          startDate: startDate,
          endDate: endDate,
          billingCycle: billingCycle,
          price: parseFloat(price),
          currency: currency,
          paymentMethod: 'payhip',
          payhipSubscriptionId: pricing_plan_id,
          payhipCustomerId: email,
          payhipProductId: product_id,
          payhipTransactionId: id,
          nextBillingDate: endDate,
          lastPaymentDate: startDate,
          lastPaymentAmount: parseFloat(price)
        });
      } else {
        subscription.status = 'active';
        subscription.lastPaymentDate = startDate;
        subscription.lastPaymentAmount = parseFloat(price);
        subscription.nextBillingDate = endDate;
        subscription.endDate = endDate;
        subscription.failedPayments = 0;
      }

      await subscription.save();

      // Create payment record
      const payment = new Payment({
        user: user._id,
        subscription: subscription._id,
        payhipTransactionId: id,
        payhipProductId: product_id,
        payhipCustomerId: email,
        amount: parseFloat(price),
        currency: currency,
        status: 'completed',
        type: 'subscription',
        plan: plan,
        billingCycle: billingCycle,
        buyerEmail: email,
        buyerName: `${first_name} ${last_name}`,
        webhookData: webhookData
      });

      await payment.save();

      // Automatically assign program based on subscription tier
      try {
        await programAssignmentService.assignProgramBySubscription(user._id, plan);
      } catch (programError) {
        console.error('⚠️ Failed to assign program automatically:', programError.message);
        // Don't fail the entire webhook if program assignment fails
      }

      console.log(`✅ Subscription activated for user ${user.email} - Plan: ${plan}`);

      return {
        success: true,
        user: user,
        subscription: subscription,
        payment: payment
      };
    } catch (error) {
      console.error('❌ Error handling paid event:', error);
      throw error;
    }
  }

  /**
   * Handle subscription created event
   */
  async handleSubscriptionCreated(webhookData) {
    try {
      const { buyer_email, subscription_id, product_id } = webhookData;

      let user = await User.findOne({ email: buyer_email.toLowerCase() });
      
      if (!user) {
        throw new Error(`User not found with email: ${buyer_email}`);
      }

      user.subscription.payhipSubscriptionId = subscription_id;
      user.subscription.payhipProductId = product_id;
      user.subscription.status = 'active';

      await user.save();

      console.log(`✅ Subscription created for user ${user.email}`);

      return { success: true, user };
    } catch (error) {
      console.error('❌ Error handling subscription created:', error);
      throw error;
    }
  }

  /**
   * Handle subscription deleted/cancelled event
   */
  async handleSubscriptionDeleted(webhookData) {
    try {
      const { buyer_email, subscription_id } = webhookData;

      let user = await User.findOne({ email: buyer_email.toLowerCase() });
      
      if (!user) {
        throw new Error(`User not found with email: ${buyer_email}`);
      }

      // Update user subscription status
      user.subscription.status = 'cancelled';
      user.subscription.cancelAtPeriodEnd = true;
      
      await user.save();

      // Update subscription record
      const subscription = await Subscription.findOne({ 
        user: user._id, 
        payhipSubscriptionId: subscription_id 
      });

      if (subscription) {
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        await subscription.save();
      }

      console.log(`✅ Subscription cancelled for user ${user.email}`);

      return { success: true, user, subscription };
    } catch (error) {
      console.error('❌ Error handling subscription deleted:', error);
      throw error;
    }
  }

  /**
   * Handle refund event
   */
  async handleRefunded(webhookData) {
    try {
      const { buyer_email, transaction_id, amount } = webhookData;

      let user = await User.findOne({ email: buyer_email.toLowerCase() });
      
      if (!user) {
        throw new Error(`User not found with email: ${buyer_email}`);
      }

      // Find original payment
      const payment = await Payment.findOne({ payhipTransactionId: transaction_id });

      if (payment) {
        payment.status = 'refunded';
        payment.refundedAt = new Date();
        payment.refundAmount = parseFloat(amount);
        await payment.save();
      }

      // Downgrade user to free plan
      const oldPlan = user.subscription.plan;
      user.subscription.plan = 'free';
      user.subscription.status = 'cancelled';
      await user.save();

      // Handle program assignment change
      try {
        await programAssignmentService.handleSubscriptionChange(user._id, oldPlan, 'free');
      } catch (programError) {
        console.error('⚠️ Failed to handle subscription change:', programError.message);
      }

      // Update subscription
      const subscription = await Subscription.findOne({ 
        user: user._id,
        status: { $in: ['active', 'cancelled'] }
      }).sort({ createdAt: -1 });

      if (subscription) {
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        subscription.cancellationReason = 'Refunded';
        await subscription.save();
      }

      console.log(`✅ Refund processed for user ${user.email}`);

      return { success: true, user, payment, subscription };
    } catch (error) {
      console.error('❌ Error handling refund:', error);
      throw error;
    }
  }

  /**
   * Get user's active subscription
   */
  async getUserSubscription(userId) {
    try {
      const user = await User.findById(userId);
      const subscription = await Subscription.findOne({ 
        user: userId, 
        status: 'active' 
      }).sort({ createdAt: -1 });

      return {
        user: user.subscription,
        subscription: subscription,
        plan: PLAN_CONFIG[user.subscription.plan] || PLAN_CONFIG.foundations
      };
    } catch (error) {
      console.error('❌ Error getting user subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId, limit = 10) {
    try {
      const payments = await Payment.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return payments;
    } catch (error) {
      console.error('❌ Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Determine plan from product ID or amount
   */
  getPlanFromProductOrAmount(productId, amount) {
    const amountNum = parseFloat(amount);

    // Try to match by product ID first
    if (productId) {
      const productLower = productId.toLowerCase();
      if (productLower.includes('foundation')) return 'foundations';
      if (productLower.includes('advanced')) return 'advanced';
      if (productLower.includes('custom') || productLower.includes('coaching')) return 'custom';
    }

    // Fallback to amount matching
    if (amountNum >= 500) return 'custom'; // Yearly custom
    if (amountNum >= 250) return 'advanced'; // Yearly advanced
    if (amountNum >= 120) return 'foundations'; // Yearly foundations
    if (amountNum >= 50) return 'custom'; // Monthly custom
    if (amountNum >= 25) return 'advanced'; // Monthly advanced
    if (amountNum >= 12) return 'foundations'; // Monthly foundations

    return 'foundations'; // Default
  }

  /**
   * Determine billing cycle from amount
   */
  getBillingCycleFromAmount(plan, amount) {
    const amountNum = parseFloat(amount);
    const config = PLAN_CONFIG[plan];

    if (!config) return 'monthly';

    // If amount is closer to yearly price, it's yearly
    const diffYearly = Math.abs(amountNum - config.yearlyPrice);
    const diffMonthly = Math.abs(amountNum - config.monthlyPrice);

    return diffYearly < diffMonthly ? 'yearly' : 'monthly';
  }

  /**
   * Check if user has access to a feature
   */
  hasAccess(userPlan, requiredPlan) {
    const planHierarchy = ['free', 'foundations', 'advanced', 'custom'];
    const userLevel = planHierarchy.indexOf(userPlan);
    const requiredLevel = planHierarchy.indexOf(requiredPlan);
    
    return userLevel >= requiredLevel;
  }
}

module.exports = new SubscriptionService();

