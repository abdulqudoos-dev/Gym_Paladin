const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  payhipTransactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  payhipProductId: {
    type: String,
    trim: true
  },
  payhipCustomerId: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  type: {
    type: String,
    enum: ['subscription', 'one_time', 'refund'],
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'foundations', 'advanced', 'custom']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly']
  },
  paymentMethod: {
    type: String,
    default: 'payhip'
  },
  buyerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  buyerName: {
    type: String,
    trim: true
  },
  refundedAt: {
    type: Date
  },
  refundReason: {
    type: String,
    trim: true
  },
  refundAmount: {
    type: Number
  },
  webhookData: {
    type: mongoose.Schema.Types.Mixed
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ payhipTransactionId: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for isRefunded
paymentSchema.virtual('isRefunded').get(function() {
  return this.status === 'refunded';
});

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);

