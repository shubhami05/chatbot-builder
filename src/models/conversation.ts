import mongoose, { Schema } from "mongoose";

export interface IConversation extends Document {
  _id: Schema.Types.ObjectId;
  chatbotId: Schema.Types.ObjectId;
  sessionId: string;
  
  // Visitor Information
  visitorInfo: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
    device?: {
      type: 'desktop' | 'mobile' | 'tablet';
      os?: string;
      browser?: string;
    };
    isReturning: boolean;
    previousSessions: number;
  };
  
  // Messages
  messages: Array<{
    id: string;
    type: 'user' | 'bot' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
      confidence?: number;
      flowId?: string;
      nodeId?: string;
      aiGenerated?: boolean;
      processingTime?: number;
      buttons?: Array<{
        text: string;
        value: string;
        clicked?: boolean;
      }>;
      attachments?: Array<{
        type: 'image' | 'file' | 'audio';
        url: string;
        name: string;
        size: number;
      }>;
    };
    edited?: {
      editedAt: Date;
      originalContent: string;
    };
  }>;
  
  // Status & Timing
  status: 'active' | 'ended' | 'transferred' | 'abandoned';
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // in seconds
  lastActivityAt: Date;
  
  // Lead Information
  lead?: {
    email?: string;
    name?: string;
    phone?: string;
    company?: string;
    customFields?: Record<string, any>;
    source?: string;
    tags?: string[];
    notes?: string;
    score?: number; // Lead quality score
  };
  
  // Satisfaction & Feedback
  satisfaction?: {
    rating?: number; // 1-5
    feedback?: string;
    submittedAt?: Date;
    categories?: string[]; // What went well/badly
  };
  
  // Conversation Analytics
  analytics: {
    messageCount: number;
    userMessageCount: number;
    botMessageCount: number;
    avgResponseTime: number;
    handoffRequested: boolean;
    goalCompleted: boolean;
    goalType?: string;
    bounceRate?: number;
    engagementScore?: number;
  };
  
  // Integration Data
  integration?: {
    transferredTo?: string; // Agent/system ID
    transferredAt?: Date;
    externalId?: string;
    syncStatus?: 'pending' | 'synced' | 'failed';
    lastSyncAt?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  chatbotId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Chatbot', 
    required: true,
    index: true 
  },
  sessionId: { 
    type: String, 
    required: true,
    index: true 
  },
  
  visitorInfo: {
    ip: String,
    userAgent: String,
    referrer: String,
    location: {
      country: String,
      region: String,
      city: String,
      timezone: String
    },
    device: {
      type: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
      os: String,
      browser: String
    },
    isReturning: { type: Boolean, default: false },
    previousSessions: { type: Number, default: 0 }
  },
  
  messages: [{
    id: { type: String, required: true },
    type: { type: String, enum: ['user', 'bot', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: Schema.Types.Mixed,
    edited: {
      editedAt: Date,
      originalContent: String
    }
  }],
  
  status: { 
    type: String, 
    enum: ['active', 'ended', 'transferred', 'abandoned'], 
    default: 'active',
    index: true 
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date ,
  duration: Number,
  lastActivityAt: { type: Date, default: Date.now },
  
  lead: {
    email: String,
    name: String,
    phone: String,
    company: String,
    customFields: Schema.Types.Mixed,
    source: String,
    tags: [String],
    notes: String,
    score: { type: Number, min: 0, max: 100 }
  },
  
  satisfaction: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    submittedAt: Date,
    categories: [String]
  },
  
  analytics: {
    messageCount: { type: Number, default: 0 },
    userMessageCount: { type: Number, default: 0 },
    botMessageCount: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    handoffRequested: { type: Boolean, default: false },
    goalCompleted: { type: Boolean, default: false },
    goalType: String,
    bounceRate: Number,
    engagementScore: Number
  },
  
  integration: {
    transferredTo: String,
    transferredAt: Date,
    externalId: String,
    syncStatus: { type: String, enum: ['pending', 'synced', 'failed'] },
    lastSyncAt: Date
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
conversationSchema.index({ chatbotId: 1, sessionId: 1 });
conversationSchema.index({ chatbotId: 1, startedAt: -1 });
conversationSchema.index({ chatbotId: 1, status: 1 });
conversationSchema.index({ startedAt: -1 });
conversationSchema.index({ 'lead.email': 1 });
conversationSchema.index({ lastActivityAt: -1 });

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastActivityAt = new Date();
  
  // Update analytics
  this.analytics.messageCount = this.messages.length;
  this.analytics.userMessageCount = this.messages.filter(m => m.type === 'user').length;
  this.analytics.botMessageCount = this.messages.filter(m => m.type === 'bot').length;
  
  // Calculate duration if conversation ended
  if (this.status === 'ended' && this.endedAt && !this.duration) {
    this.duration = Math.floor((this.endedAt?.getTime()  - this.startedAt.getTime()) / 1000);
  }
  
  next();
});

export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema);

