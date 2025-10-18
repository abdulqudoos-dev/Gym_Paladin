const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const subscriptionService = require('../services/subscriptionService');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

/**
 * @desc    Get current user's subscription
 * @route   GET /api/subscriptions/me
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const subscriptionData = await subscriptionService.getUserSubscription(req.user._id);

    res.json({
      success: true,
      subscription: subscriptionData
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscription'
    });
  }
});

/**
 * @desc    Get user's payment history
 * @route   GET /api/subscriptions/payments
 * @access  Private
 */
router.get('/payments', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const payments = await subscriptionService.getPaymentHistory(req.user._id, limit);

    res.json({
      success: true,
      count: payments.length,
      payments: payments
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment history'
    });
  }
});

/**
 * @desc    Get all subscriptions (Admin only)
 * @route   GET /api/subscriptions
 * @access  Private/Admin
 */
router.get('/', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const subscriptions = await Subscription.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments();

    res.json({
      success: true,
      count: subscriptions.length,
      total: total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      subscriptions: subscriptions
    });
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscriptions'
    });
  }
});

/**
 * @desc    Get subscription statistics (Admin only)
 * @route   GET /api/subscriptions/stats
 * @access  Private/Admin
 */
router.get('/stats', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const stats = await Subscription.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]);

    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const cancelledSubscriptions = await Subscription.countDocuments({ status: 'cancelled' });

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        cancelled: cancelledSubscriptions,
        byPlan: stats,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving statistics'
    });
  }
});

/**
 * @desc    Cancel subscription
 * @route   POST /api/subscriptions/cancel
 * @access  Private
 */
router.post('/cancel', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscription.payhipSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Mark for cancellation at period end
    user.subscription.cancelAtPeriodEnd = true;
    await user.save();

    const subscription = await Subscription.findOne({
      user: user._id,
      payhipSubscriptionId: user.subscription.payhipSubscriptionId
    });

    if (subscription) {
      subscription.cancellationReason = req.body.reason || 'User requested cancellation';
      await subscription.save();
    }

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription'
    });
  }
});

/**
 * @desc    Reactivate cancelled subscription
 * @route   POST /api/subscriptions/reactivate
 * @access  Private
 */
router.post('/reactivate', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscription.cancelAtPeriodEnd) {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not marked for cancellation'
      });
    }

    user.subscription.cancelAtPeriodEnd = false;
    await user.save();

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error reactivating subscription'
    });
  }
});

/**
 * @desc    Get plan details
 * @route   GET /api/subscriptions/plans
 * @access  Public
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'foundations',
        name: 'Foundations',
        monthlyPrice: 12,
        yearlyPrice: 120,
        description: 'Perfect for beginners starting their fitness journey',
        features: [
          'Access To All Exercise Videos',
          'Progress Tracking',
          'Supportive Online Community',
          'Personalized Workout Plans',
          'Basic Nutrition Guidance'
        ]
      },
      {
        id: 'advanced',
        name: 'Advanced Accelerator',
        monthlyPrice: 25,
        yearlyPrice: 250,
        description: 'For serious athletes looking to accelerate their progress',
        features: [
          'Everything in Foundations',
          'Fully Customized Workout Plans',
          'Weekly Check-ins with Trainer',
          'Advanced Nutrition Coaching',
          'Priority Support'
        ],
        popular: true
      },
      {
        id: 'custom',
        name: 'Custom Coaching',
        monthlyPrice: 50,
        yearlyPrice: 500,
        description: 'Ultimate personalized experience with dedicated coaching',
        features: [
          'Everything in Advanced',
          'Dedicated Personal Trainer',
          '100% Custom Programming',
          'Daily Check-ins & Accountability',
          'Video Form Checks',
          'VIP Community Access'
        ]
      }
    ];

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plans'
    });
  }
});

module.exports = router;

