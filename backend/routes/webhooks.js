const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');

/**
 * @desc    Payhip Webhook Handler
 * @route   POST /api/webhooks/payhip
 * @access  Public (Payhip only)
 */
router.post('/payhip', async (req, res) => {
  try {
    console.log('📩 Payhip webhook received:', JSON.stringify(req.body, null, 2));

    const webhookData = req.body;
    const eventType = webhookData.type;

    // Validate webhook has required fields
    if (!eventType) {
      console.error('❌ Webhook missing event type');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing event type' 
      });
    }

    let result;

    // Handle different webhook events
    switch (eventType) {
      case 'paid':
        console.log('💳 Processing paid event');
        console.log('🎉 NEW SUBSCRIBER: Payment webhook triggered for new subscription!');
        result = await subscriptionService.handlePaidEvent(webhookData);
        break;

      case 'subscription.created':
        console.log('🎉 Processing subscription created event');
        result = await subscriptionService.handleSubscriptionCreated(webhookData);
        break;

      case 'subscription.deleted':
        console.log('❌ Processing subscription deleted event');
        result = await subscriptionService.handleSubscriptionDeleted(webhookData);
        break;

      case 'refunded':
        console.log('💸 Processing refund event');
        result = await subscriptionService.handleRefunded(webhookData);
        break;

      default:
        console.log(`⚠️ Unhandled webhook event: ${eventType}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Event type not handled' 
        });
    }

    console.log(`✅ Webhook processed successfully: ${eventType}`);

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      event: eventType,
      data: result
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    // Still return 200 to prevent Payhip from retrying
    // but log the error for investigation
    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

/**
 * @desc    Test webhook endpoint
 * @route   GET /api/webhooks/test
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is active',
    endpoint: '/api/webhooks/payhip',
    supportedEvents: ['paid', 'subscription.created', 'subscription.deleted', 'refunded']
  });
});

module.exports = router;

