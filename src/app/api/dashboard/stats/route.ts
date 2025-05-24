import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/hooks/auth-helpers';
import connectDB from '@/lib/mongoose';
import { Chatbot } from '@/models/chatbot';
import { Conversation } from '@/models/conversation';
import { User } from '@/models/user';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's chatbots
    const chatbots = await Chatbot.find({ userId: user.id }).select('_id');
    const chatbotIds = chatbots.map(c => c._id);

    // Calculate stats for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalChatbots,
      totalConversations,
      totalMessages,
      activeConversations,
      userUsage
    ] = await Promise.all([
      Chatbot.countDocuments({ userId: user.id }),
      Conversation.countDocuments({ 
        chatbotId: { $in: chatbotIds },
        startedAt: { $gte: thirtyDaysAgo }
      }),
      Conversation.aggregate([
        { $match: { chatbotId: { $in: chatbotIds }, startedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: { $size: '$messages' } } } }
      ]),
      Conversation.countDocuments({ 
        chatbotId: { $in: chatbotIds },
        status: 'active'
      }),
      User.findById(user.id).select('usage')
    ]);

    // Calculate conversion rate (conversations with lead info / total conversations)
    const conversationsWithLeads = await Conversation.countDocuments({
      chatbotId: { $in: chatbotIds },
      startedAt: { $gte: thirtyDaysAgo },
      'lead.email': { $exists: true }
    });

    const conversionRate = totalConversations > 0 
      ? conversationsWithLeads / totalConversations 
      : 0;

    const stats = {
      totalChatbots,
      totalConversations,
      totalMessages: totalMessages[0]?.total || 0,
      activeConversations,
      monthlyMessageUsage: userUsage?.usage?.monthlyMessages || 0,
      conversionRate: conversionRate
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}