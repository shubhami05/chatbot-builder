import mongoose, { Schema } from "mongoose";

export interface ISubscription extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  
  // Razorpay Information
  razorpaySubscriptionId: string;
  razorpayCustomerId: string;
  razorpayPlanId: string;
  razorpayPaymentId?: string;
  
  // Subscription Details
  plan: {
    name: string;
    tier: 'free' | 'pro' | 'enterprise';
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
    limits: {
      chatbots: number;
      messagesPerMonth: number;
      apiCallsPerMonth: number;
      storageGB: number;
      teamMembers: number;
      customBranding: boolean;
      prioritySupport: boolean;
      analytics: boolean;
      aiIntegration: boolean;
      whiteLabel: boolean;
    };
  };
  
  // Status & Timing
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  cancelReason?: string;
  
  // Billing
  billing: {
    nextPaymentDate?: Date;
    lastPaymentDate?: Date;
    lastPaymentAmount?: number;
    failedPaymentAttempts: number;
    paymentMethod?: {
      type: 'card' | 'bank' | 'paypal';
      last4?: string;
      brand?: string;
      expiryMonth?: number;
      expiryYear?: number;
    };
  };
  
  // Usage Tracking
  usage: {
    currentPeriod: {
      chatbots: number;
      messages: number;
      apiCalls: number;
      storage: number;
    };
    overageCharges: Array<{
      type: 'messages' | 'api_calls' | 'storage';
      quantity: number;
      unitPrice: number;
      totalAmount: number;
      period: string;
      chargedAt: Date;
    }>;
  };
  
  // Discounts & Promotions
  discounts: Array<{
    couponId: string;
    couponCode?: string;
    percentOff?: number;
    amountOff?: number;
    duration: 'once' | 'repeating' | 'forever';
    durationInMonths?: number;
    appliedAt: Date;
    expiresAt?: Date;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  razorpaySubscriptionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  razorpayCustomerId: { type: String, required: true },
  razorpayPlanId: { type: String, required: true },
  razorpayPaymentId: String,
  
  plan: {
    name: { type: String, required: true },
    tier: { type: String, enum: ['free', 'pro', 'enterprise'], required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    interval: { type: String, enum: ['month', 'year'], required: true },
    features: [String],
    limits: {
      chatbots: { type: Number, default: 1 },
      messagesPerMonth: { type: Number, default: 100 },
      apiCallsPerMonth: { type: Number, default: 1000 },
      storageGB: { type: Number, default: 1 },
      teamMembers: { type: Number, default: 1 },
      customBranding: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      aiIntegration: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false }
    }
  },
  
  status: { 
    type: String, 
    enum: ['active', 'cancelled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired'], 
    required: true,
    index: true 
  },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  trialStart: Date,
  trialEnd: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false },
  canceledAt: Date,
  cancelReason: String,
  
  billing: {
    nextPaymentDate: Date,
    lastPaymentDate: Date,
    lastPaymentAmount: Number,
    failedPaymentAttempts: { type: Number, default: 0 },
    paymentMethod: {
      type: { type: String, enum: ['card', 'bank', 'paypal'] },
      last4: String,
      brand: String,
      expiryMonth: Number,
      expiryYear: Number
    }
  },
  
  usage: {
    currentPeriod: {
      chatbots: { type: Number, default: 0 },
      messages: { type: Number, default: 0 },
      apiCalls: { type: Number, default: 0 },
      storage: { type: Number, default: 0 }
    },
    overageCharges: [{
      type: { type: String, enum: ['messages', 'api_calls', 'storage'] },
      quantity: Number,
      unitPrice: Number,
      totalAmount: Number,
      period: String,
      chargedAt: Date
    }]
  },
  
  discounts: [{
    couponId: String,
    couponCode: String,
    percentOff: Number,
    amountOff: Number,
    duration: { type: String, enum: ['once', 'repeating', 'forever'] },
    durationInMonths: Number,
    appliedAt: Date,
    expiresAt: Date
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ createdAt: -1 });

// Pre-save middleware
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', subscriptionSchema);
