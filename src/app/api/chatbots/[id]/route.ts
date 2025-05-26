import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongoose';
import { Chatbot } from '@/models/chatbot';
import { User } from '@/models/user';
import { Conversation } from '@/models/conversation';
import { Types } from 'mongoose';
import { authOptions } from '../../auth/[...nextauth]/route';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Fetch single chatbot
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid chatbot ID' }, { status: 400 });
    }

    const chatbot = await Chatbot.findOne({
      _id: params.id,
      userId: user._id
    });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    return NextResponse.json({ chatbot });

  } catch (error) {
    console.error('Get chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chatbot' },
      { status: 500 }
    );
  }
}

// PATCH: Update chatbot
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid chatbot ID' }, { status: 400 });
    }

    const updates = await request.json();
    
    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.userId;
    delete updates.createdAt;
    delete updates['integration.apiKey']; // Prevent API key changes via regular update

    // Validate name if being updated
    if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
      return NextResponse.json({ error: 'Chatbot name is required' }, { status: 400 });
    }

    // Validate configuration limits based on subscription
    if (updates.config || updates.styling || updates.ai) {
      const subscriptionFeatures = {
        free: {
          aiIntegration: false,
          customBranding: false,
          advancedStyling: false
        },
        pro: {
          aiIntegration: true,
          customBranding: true,
          advancedStyling: true
        },
        enterprise: {
          aiIntegration: true,
          customBranding: true,
          advancedStyling: true
        }
      };

      const userFeatures = subscriptionFeatures[user.subscription.tier as keyof typeof subscriptionFeatures];

      // Check AI feature access
      if (updates.ai?.enabled && !userFeatures.aiIntegration) {
        return NextResponse.json({ 
          error: 'AI integration requires Pro or Enterprise subscription' 
        }, { status: 403 });
      }

      // Check custom CSS access
      if (updates.styling?.customCSS && !userFeatures.customBranding) {
        return NextResponse.json({ 
          error: 'Custom CSS requires Pro or Enterprise subscription' 
        }, { status: 403 });
      }
    }

    const chatbot = await Chatbot.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      chatbot 
    });

  } catch (error) {
    console.error('Update chatbot error:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid data provided' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update chatbot' },
      { status: 500 }
    );
  }
}

// DELETE: Delete chatbot
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid chatbot ID' }, { status: 400 });
    }

    // Check if chatbot exists and belongs to user
    const chatbot = await Chatbot.findOne({
      _id: params.id,
      userId: user._id
    });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    // Get conversation count for analytics
    const conversationCount = await Conversation.countDocuments({
      chatbotId: params.id
    });

    // Delete related conversations first (cascade delete)
    await Conversation.deleteMany({ chatbotId: params.id });

    // Delete the chatbot
    await Chatbot.findByIdAndDelete(params.id);

    // Update user's chatbot count
    await User.findByIdAndUpdate(user._id, {
      $inc: { 'usage.chatbots': -1 }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Chatbot and related data deleted successfully',
      stats: {
        conversationsDeleted: conversationCount
      }
    });

  } catch (error) {
    console.error('Delete chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chatbot' },
      { status: 500 }
    );
  }
}

// Additional endpoints for specific chatbot operations

// GET analytics for specific chatbot
export async function getAnalytics(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30'); // days
    
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    // Validate ObjectId
    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid chatbot ID' }, { status: 400 });
    }

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: params.id,
      userId: user._id
    });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    // Aggregate analytics data
    const [
      totalConversations,
      totalMessages,
      avgSessionDuration,
      satisfactionDistribution,
      dailyStats,
      topQuestions,
      responseTimeStats
    ] = await Promise.all([
      // Total conversations
      Conversation.countDocuments({
        chatbotId: params.id,
        startedAt: { $gte: startDate }
      }),

      // Total messages
      Conversation.aggregate([
        { $match: { chatbotId: new Types.ObjectId(params.id), startedAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: { $size: '$messages' } } } }
      ]),

      // Average session duration
      Conversation.aggregate([
        { $match: { chatbotId: new Types.ObjectId(params.id), startedAt: { $gte: startDate }, duration: { $exists: true } } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]),

      // Satisfaction distribution
      Conversation.aggregate([
        { $match: { chatbotId: new Types.ObjectId(params.id), 'satisfaction.rating': { $exists: true } } },
        { $group: { _id: '$satisfaction.rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),

      // Daily stats
      Conversation.aggregate([
        { $match: { chatbotId: new Types.ObjectId(params.id), startedAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } },
            conversations: { $sum: 1 },
            messages: { $sum: { $size: '$messages' } }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Top questions (from conversation messages)
      Conversation.aggregate([
        { $match: { chatbotId: new Types.ObjectId(params.id), startedAt: { $gte: startDate } } },
        { $unwind: '$messages' },
        { $match: { 'messages.type': 'user' } },
        { $group: { _id: '$messages.content', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Response time statistics
      Conversation.aggregate([
        { $match: { chatbotId: new Types.ObjectId(params.id), startedAt: { $gte: startDate } } },
        { $unwind: '$messages' },
        { $match: { 'messages.metadata.processingTime': { $exists: true } } },
        {
          $group: {
            _id: null,
            avg: { $avg: '$messages.metadata.processingTime' },
            min: { $min: '$messages.metadata.processingTime' },
            max: { $max: '$messages.metadata.processingTime' },
            median: { $avg: '$messages.metadata.processingTime' } // Simplified median
          }
        }
      ])
    ]);

    // Calculate conversion rate
    const conversationsWithLeads = await Conversation.countDocuments({
      chatbotId: params.id,
      startedAt: { $gte: startDate },
      'lead.email': { $exists: true }
    });

    const conversionRate = totalConversations > 0 
      ? Math.round((conversationsWithLeads / totalConversations) * 100) 
      : 0;

    // Format satisfaction distribution
    const satisfactionMap: Record<number, number> = {};
    for (let i = 1; i <= 5; i++) {
      satisfactionMap[i] = 0;
    }
    satisfactionDistribution.forEach((item: any) => {
      if (item._id >= 1 && item._id <= 5) {
        satisfactionMap[item._id] = item.count;
      }
    });

    // Format daily stats
    const formattedDailyStats = dailyStats.map((day: any) => ({
      date: day._id,
      conversations: day.conversations,
      messages: day.messages
    }));

    // Format top questions
    const formattedTopQuestions = topQuestions.map((q: any) => ({
      question: q._id,
      count: q.count
    }));

    const analytics = {
      summary: {
        totalConversations,
        totalMessages: totalMessages[0]?.total || 0,
        avgSessionDuration: avgSessionDuration[0]?.avgDuration || 0,
        conversionRate
      },
      satisfactionDistribution: satisfactionMap,
      dailyStats: formattedDailyStats,
      topQuestions: formattedTopQuestions,
      responseTimeStats: responseTimeStats[0] || {
        avg: 0, min: 0, max: 0, median: 0
      }
    };

    return NextResponse.json({ analytics });

  } catch (error) {
    console.error('Get chatbot analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}