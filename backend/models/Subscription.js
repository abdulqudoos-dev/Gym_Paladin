const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'foundations', 'advanced', 'custom'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'payhip'],
    default: 'payhip'
  },
  stripeSubscriptionId: {
    type: String,
    trim: true
  },
  stripeCustomerId: {
    type: String,
    trim: true
  },
  payhipSubscriptionId: {
    type: String,
    trim: true
  },
  payhipCustomerId: {
    type: String,
    trim: true
  },
  payhipProductId: {
    type: String,
    trim: true
  },
  payhipTransactionId: {
    type: String,
    trim: true
  },
  trialEndsAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  nextBillingDate: {
    type: Date
  },
  lastPaymentDate: {
    type: Date
  },
  lastPaymentAmount: {
    type: Number
  },
  failedPayments: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ startDate: -1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

// Virtual for subscription duration
subscriptionSchema.virtual('duration').get(function() {
  if (this.endDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((Date.now() - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for isActive
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && (!this.endDate || this.endDate > new Date());
});

// Virtual for isTrial
subscriptionSchema.virtual('isTrial').get(function() {
  return this.status === 'trial' && this.trialEndsAt && this.trialEndsAt > new Date();
});

// Ensure virtual fields are serialized
subscriptionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
