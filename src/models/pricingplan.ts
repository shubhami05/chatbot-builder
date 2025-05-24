import mongoose, { Schema } from "mongoose";

export interface IPricingPlan extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  razorpayPlanId: string;
  razorpayProductId?: string;
  
  features: Array<{
    name: string;
    description?: string;
    included: boolean;
    limit?: number;
  }>;
  
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
  
  isActive: boolean;
  sortOrder: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const pricingPlanSchema = new Schema<IPricingPlan>({
  name: { type: String, required: true },
  tier: { type: String, enum: ['free', 'pro', 'enterprise'], required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'usd' },
  interval: { type: String, enum: ['month', 'year'], required: true },
  razorpayPlanId: { type: String, required: true, unique: true },
  razorpayProductId: String,
  
  features: [{
    name: { type: String, required: true },
    description: String,
    included: { type: Boolean, required: true },
    limit: Number
  }],
  
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
  },
  
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
pricingPlanSchema.index({ tier: 1, interval: 1 });
pricingPlanSchema.index({ isActive: 1, sortOrder: 1 });
pricingPlanSchema.index({ razorpayPlanId: 1 }, { unique: true });

export const PricingPlan = mongoose.models.PricingPlan || mongoose.model<IPricingPlan>('PricingPlan', pricingPlanSchema);
