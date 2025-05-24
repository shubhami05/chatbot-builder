import { User } from '@/models/user';
import { Chatbot } from '@/models/chatbot';
import { Conversation } from '@/models/conversation';
import { PricingPlan } from '@/models/pricingplan';
import { Subscription } from '@/models/subscription';
import  connectDB  from './mongoose';

// User utilities
export class UserService {
  static async createUser(userData: {
    name: string;
    email: string;
    password: string;
  }) {
    await connectDB();
    
    const user = new User({
      ...userData,
      settings: {
        notifications: {
          email: true,
          newMessages: true,
          monthlyReports: true,
          systemUpdates: false,
        },
        timezone: 'UTC',
        language: 'en',
        theme: 'light',
      },
      usage: {
        chatbots: 0,
        messages: 0,
        monthlyMessages: 0,
        lastResetDate: new Date(),
        apiCalls: 0,
        storage: 0,
      }
    });
    
    return await user.save();
  }
  
  static async getUserByEmail(email: string) {
    await connectDB();
    return await User.findOne({ email }).lean();
  }
  
  static async updateUserUsage(userId: string, updates: {
    chatbots?: number;
    messages?: number;
    apiCalls?: number;
    storage?: number;
  }) {
    await connectDB();
    
    const updateQuery: any = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateQuery[`usage.${key}`] = value;
      }
    });
    
    return await User.findByIdAndUpdate(
      userId,
      { $inc: updateQuery },
      { new: true }
    );
  }
  
  static async resetMonthlyUsage(userId: string) {
    await connectDB();
    
    return await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'usage.monthlyMessages': 0,
          'usage.lastResetDate': new Date()
        }
      },
      { new: true }
    );
  }
  
  static async checkSubscriptionLimits(userId: string) {
    await connectDB();
    
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    const subscription = await Subscription.findOne({ userId });
    
    const limits = subscription?.plan.limits || {
      chatbots: 1,
      messagesPerMonth: 100,
      apiCallsPerMonth: 1000,
      storageGB: 1,
      teamMembers: 1
    };
    
    return {
      chatbots: {
        used: user.usage.chatbots,
        limit: limits.chatbots,
        available: limits.chatbots === -1 ? Infinity : Math.max(0, limits.chatbots - user.usage.chatbots)
      },
      messages: {
        used: user.usage.monthlyMessages,
        limit: limits.messagesPerMonth,
        available: limits.messagesPerMonth === -1 ? Infinity : Math.max(0, limits.messagesPerMonth - user.usage.monthlyMessages)
      },
      apiCalls: {
        used: user.usage.apiCalls,
        limit: limits.apiCallsPerMonth,
        available: limits.apiCallsPerMonth === -1 ? Infinity : Math.max(0, limits.apiCallsPerMonth - user.usage.apiCalls)
      },
      storage: {
        used: user.usage.storage,
        limit: limits.storageGB * 1024, // Convert to MB
        available: limits.storageGB === -1 ? Infinity : Math.max(0, (limits.storageGB * 1024) - user.usage.storage)
      }
    };
  }
}

// Chatbot utilities
export class ChatbotService {
  static async createChatbot(userId: string, chatbotData: {
    name: string;
    description?: string;
    config?: any;
    styling?: any;
  }) {
    await connectDB();
    
    // Check user limits
    const limits = await UserService.checkSubscriptionLimits(userId);
    if (limits.chatbots.available <= 0) {
      throw new Error('Chatbot limit exceeded. Please upgrade your subscription.');
    }
    
    const chatbot = new Chatbot({
      userId,
      name: chatbotData.name,
      description: chatbotData.description,
      config: {
        greeting: chatbotData.config?.greeting || 'Hello! How can I help you today?',
        fallbackMessage: chatbotData.config?.fallbackMessage || 'I\'m sorry, I didn\'t understand that.',
        collectEmail: chatbotData.config?.collectEmail || false,
        collectPhone: chatbotData.config?.collectPhone || false,
        allowFileUpload: chatbotData.config?.allowFileUpload || false,
        maxFileSize: chatbotData.config?.maxFileSize || 5,
        allowedFileTypes: chatbotData.config?.allowedFileTypes || ['jpg', 'png', 'pdf'],
        autoReply: chatbotData.config?.autoReply !== false,
        businessHours: {
          enabled: false,
          timezone: 'UTC',
          schedule: [],
          outsideHoursMessage: 'Thanks for your message! We\'ll get back to you during business hours.'
        },
        language: chatbotData.config?.language || 'en',
        responseDelay: chatbotData.config?.responseDelay || 1000
      },
      styling: {
        primaryColor: chatbotData.styling?.primaryColor || '#007bff',
        secondaryColor: chatbotData.styling?.secondaryColor || '#6c757d',
        backgroundColor: chatbotData.styling?.backgroundColor || '#ffffff',
        textColor: chatbotData.styling?.textColor || '#333333',
        fontFamily: chatbotData.styling?.fontFamily || 'Inter, sans-serif',
        fontSize: chatbotData.styling?.fontSize || 14,
        borderRadius: chatbotData.styling?.borderRadius || 8,
        position: chatbotData.styling?.position || 'bottom-right',
        width: chatbotData.styling?.width || 350,
        height: chatbotData.styling?.height || 500,
        buttonStyle: chatbotData.styling?.buttonStyle || 'round',
        shadowEnabled: chatbotData.styling?.shadowEnabled !== false,
        animationEnabled: chatbotData.styling?.animationEnabled !== false
      }
    });
    
    const savedChatbot = await chatbot.save();
    
    // Update user usage
    await UserService.updateUserUsage(userId, { chatbots: 1 });
    
    return savedChatbot;
  }
  
  static async getChatbotsByUser(userId: string) {
    await connectDB();
    
    return await Chatbot.find({ userId })
      .select('-flows -knowledgeBase') // Exclude heavy data for list view
      .sort({ createdAt: -1 });
  }
  
  static async getChatbotById(chatbotId: string, userId?: string) {
    await connectDB();
    
    const query: any = { _id: chatbotId };
    if (userId) query.userId = userId;
    
    return await Chatbot.findOne(query);
  }
  
  static async updateChatbot(chatbotId: string, userId: string, updates: any) {
    await connectDB();
    
    return await Chatbot.findOneAndUpdate(
      { _id: chatbotId, userId },
      { $set: updates },
      { new: true }
    );
  }
  
  static async deleteChatbot(chatbotId: string, userId: string) {
    await connectDB();
    
    // Delete chatbot
    const chatbot = await Chatbot.findOneAndDelete({ _id: chatbotId, userId });
    
    if (chatbot) {
      // Delete associated conversations
      await Conversation.deleteMany({ chatbotId });
      
      // Update user usage
      await UserService.updateUserUsage(userId, { chatbots: -1 });
    }
    
    return chatbot;
  }
  
  static async updateAnalytics(chatbotId: string, analytics: {
    totalConversations?: number;
    totalMessages?: number;
    uniqueVisitors?: number;
    averageSessionDuration?: number;
  }) {
    await connectDB();
    
    const updateQuery: any = {};
    Object.entries(analytics).forEach(([key, value]) => {
      if (value !== undefined) {
        updateQuery[`analytics.${key}`] = value;
      }
    });
    
    return await Chatbot.findByIdAndUpdate(
      chatbotId,
      { $inc: updateQuery },
      { new: true }
    );
  }
}

// Conversation utilities
export class ConversationService {
  static async createConversation(conversationData: {
    chatbotId: string;
    sessionId: string;
    visitorInfo?: any;
  }) {
    await connectDB();
    
    const conversation = new Conversation({
      chatbotId: conversationData.chatbotId,
      sessionId: conversationData.sessionId,
      visitorInfo: conversationData.visitorInfo || {},
      messages: [],
      analytics: {
        messageCount: 0,
        userMessageCount: 0,
        botMessageCount: 0,
        avgResponseTime: 0,
        handoffRequested: false,
        goalCompleted: false
      }
    });
    
    return await conversation.save();
  }
  
  static async getOrCreateConversation(chatbotId: string, sessionId: string, visitorInfo?: any) {
    await connectDB();
    
    let conversation = await Conversation.findOne({
      chatbotId,
      sessionId,
      status: 'active'
    });
    
    if (!conversation) {
      conversation = await this.createConversation({
        chatbotId,
        sessionId,
        visitorInfo
      });
    }
    
    return conversation;
  }
  
  static async addMessage(conversationId: string, message: {
    type: 'user' | 'bot' | 'system';
    content: string;
    metadata?: any;
  }) {
    await connectDB();
    
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: message.type,
      content: message.content,
      timestamp: new Date(),
      metadata: message.metadata
    };
    
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: { messages: messageData },
        $set: { lastActivityAt: new Date() }
      },
      { new: true }
    );
    
    // Update message counts in analytics
    if (conversation) {
      await this.updateConversationAnalytics(conversationId);
    }
    
    return conversation;
  }
  
  static async endConversation(conversationId: string, reason?: string) {
    await connectDB();
    
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          status: 'ended',
          endedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (conversation && conversation.startedAt) {
      // Calculate duration
      const duration = Math.floor((new Date().getTime() - conversation.startedAt.getTime()) / 1000);
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { duration }
      });
    }
    
    return conversation;
  }
  
  static async updateConversationAnalytics(conversationId: string) {
    await connectDB();
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return;
    
    const userMessages = conversation.messages.filter((m: { type: string; }) => m.type === 'user');
    const botMessages = conversation.messages.filter((m: { type: string; }) => m.type === 'bot');
    
    // Calculate average response time (time between user message and bot response)
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (let i = 0; i < conversation.messages.length - 1; i++) {
      const current = conversation.messages[i];
      const next = conversation.messages[i + 1];
      
      if (current.type === 'user' && next.type === 'bot') {
        const responseTime = next.timestamp.getTime() - current.timestamp.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }
    
    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        'analytics.messageCount': conversation.messages.length,
        'analytics.userMessageCount': userMessages.length,
        'analytics.botMessageCount': botMessages.length,
        'analytics.avgResponseTime': avgResponseTime
      }
    });
  }
  
  static async getConversationsByUser(userId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}) {
    await connectDB();
    
    const { page = 1, limit = 20, status, dateFrom, dateTo } = options;
    
    // Get user's chatbots
    const chatbots = await Chatbot.find({ userId }).select('_id');
    const chatbotIds = chatbots.map(c => c._id);
    
    // Build query
    const query: any = { chatbotId: { $in: chatbotIds } };
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.startedAt = {};
      if (dateFrom) query.startedAt.$gte = dateFrom;
      if (dateTo) query.startedAt.$lte = dateTo;
    }
    
    const skip = (page - 1) * limit;
    
    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .populate('chatbotId', 'name')
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit),
      Conversation.countDocuments(query)
    ]);
    
    return {
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getConversationAnalytics(chatbotId: string, period: 'day' | 'week' | 'month' = 'month') {
    await connectDB();
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const conversations = await Conversation.find({
      chatbotId,
      startedAt: { $gte: startDate }
    }).select('startedAt endedAt duration messages analytics satisfaction');
    
    // Calculate metrics
    const totalConversations = conversations.length;
    const completedConversations = conversations.filter(c => c.status === 'ended').length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const avgSessionDuration = conversations
      .filter(c => c.duration)
      .reduce((sum, c) => sum + c.duration!, 0) / completedConversations || 0;
    
    const satisfactionRatings = conversations
      .filter(c => c.satisfaction?.rating)
      .map(c => c.satisfaction!.rating!);
    const avgSatisfaction = satisfactionRatings.length > 0 
      ? satisfactionRatings.reduce((a, b) => a + b, 0) / satisfactionRatings.length 
      : 0;
    
    // Daily breakdown
    const dailyStats = this.generateDailyStats(conversations, startDate, now);
    
    return {
      summary: {
        totalConversations,
        completedConversations,
        totalMessages,
        avgSessionDuration,
        avgSatisfaction,
        conversionRate: 0 // Calculate based on your conversion goals
      },
      dailyStats,
      topQuestions: await this.getTopQuestions(chatbotId, startDate)
    };
  }
  
  private static generateDailyStats(conversations: any[], startDate: Date, endDate: Date) {
    const stats: Record<string, { conversations: number; messages: number }> = {};
    
    // Initialize all dates
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      stats[dateKey] = { conversations: 0, messages: 0 };
    }
    
    // Populate with actual data
    conversations.forEach(conv => {
      const dateKey = conv.startedAt.toISOString().split('T')[0];
      if (stats[dateKey]) {
        stats[dateKey].conversations++;
        stats[dateKey].messages += conv.messages.length;
      }
    });
    
    return Object.entries(stats).map(([date, data]) => ({
      date,
      ...data
    }));
  }
  
  private static async getTopQuestions(chatbotId: string, startDate: Date) {
    const conversations = await Conversation.find({
      chatbotId,
      startedAt: { $gte: startDate }
    }).select('messages.content messages.type');
    
    const userMessages = conversations
      .flatMap(conv => conv.messages)
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content.toLowerCase().trim())
      .filter(content => content.length > 0);
    
    // Count frequency
    const frequency: Record<string, number> = {};
    userMessages.forEach(msg => {
      frequency[msg] = (frequency[msg] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));
  }
}

// Subscription utilities
export class SubscriptionService {
  static async createSubscription(subscriptionData: {
    userId: string;
    razorpaySubscriptionId: string;
    razorpayCustomerId: string;
    razorpayPlanId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }) {
    await connectDB();
    
    // Get plan details from Razorpay plan ID
    const plan = await PricingPlan.findOne({ razorpayPlanId: subscriptionData.razorpayPlanId });
    if (!plan) throw new Error('Pricing plan not found');
    
    const subscription = new Subscription({
      ...subscriptionData,
      razorpayProductId: plan.razorpayProductId,
      plan: {
        name: plan.name,
        tier: plan.tier,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features.map((f: { name: any; }) => f.name),
        limits: plan.limits
      },
      billing: {
        failedPaymentAttempts: 0
      },
      usage: {
        currentPeriod: {
          chatbots: 0,
          messages: 0,
          apiCalls: 0,
          storage: 0
        },
        overageCharges: []
      },
      discounts: []
    });
    
    const savedSubscription = await subscription.save();
    
    // Update user subscription info
    await User.findByIdAndUpdate(subscriptionData.userId, {
      $set: {
        'subscription.tier': plan.tier,
        'subscription.status': subscriptionData.status,
        'subscription.razorpayCustomerId': subscriptionData.razorpayCustomerId,
        'subscription.razorpaySubscriptionId': subscriptionData.razorpaySubscriptionId,
        'subscription.currentPeriodStart': subscriptionData.currentPeriodStart,
        'subscription.currentPeriodEnd': subscriptionData.currentPeriodEnd
      }
    });
    
    return savedSubscription;
  }
  
  static async updateSubscriptionStatus(razorpaySubscriptionId: string, status: string) {
    await connectDB();
    
    const subscription = await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId },
      { $set: { status } },
      { new: true }
    );
    
    if (subscription) {
      // Update user status
      await User.findByIdAndUpdate(subscription.userId, {
        $set: { 'subscription.status': status }
      });
    }
    
    return subscription;
  }
  
  static async cancelSubscription(razorpaySubscriptionId: string, reason?: string) {
    await connectDB();
    
    return await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId },
      {
        $set: {
          status: 'cancelled',
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
          cancelReason: reason
        }
      },
      { new: true }
    );
  }
}

// Pricing Plan utilities
export class PricingPlanService {
  static async getActivePlans() {
    await connectDB();
    
    return await PricingPlan.find({ isActive: true })
      .sort({ sortOrder: 1, price: 1 });
  }
  
  static async getPlanByTier(tier: string, interval: string = 'month') {
    await connectDB();
    
    return await PricingPlan.findOne({
      tier,
      interval,
      isActive: true
    });
  }
  
  static async createPlan(planData: {
    name: string;
    tier: 'free' | 'pro' | 'enterprise';
    description: string;
    price: number;
    interval: 'month' | 'year';
    razorpayPlanId: string;
    razorpayProductId?: string;
    features: any[];
    limits: any;
  }) {
    await connectDB();
    
    const plan = new PricingPlan({
      ...planData,
      isActive: true,
      sortOrder: 0
    });
    
    return await plan.save();
  }
}
