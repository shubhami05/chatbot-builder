import { getAuthenticatedUser } from "@/hooks/auth-helpers";
import connectDB from "@/lib/mongoose";
import { Chatbot } from "@/models/chatbot";
import { Conversation } from "@/models/conversation";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's chatbots
    const chatbots = await Chatbot.find({ userId: user.id })
      .select('_id name')
      .lean();
    const chatbotIds = chatbots.map(c => c.id);
    const chatbotMap = new Map(chatbots.map(c => [c.id.toString(), c.name]));

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activities: { id: string; type: string; chatbotName: any; description: string; timestamp: any; }[] = [];

    // Recent conversations
    const recentConversations = await Conversation.find({
      chatbotId: { $in: chatbotIds },
      startedAt: { $gte: sevenDaysAgo }
    })
    .sort({ startedAt: -1 })
    .limit(10)
    .select('chatbotId startedAt messages.length')
    .lean();

    recentConversations.forEach((conv: any) => {
      activities.push({
        id: `conv_${conv._id}`,
        type: 'conversation',
        chatbotName: chatbotMap.get(conv.chatbotId.toString()) || 'Unknown',
        description: `New conversation started with ${conv.messages?.length || 0} messages`,
        timestamp: conv.startedAt
      });
    });

    // Recently created chatbots
    const recentChatbots = await Chatbot.find({
      userId: user.id,
      createdAt: { $gte: sevenDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id name createdAt')
    .lean();

    recentChatbots.forEach((chatbot: any) => {
      activities.push({
        id: `chatbot_${chatbot._id}`,
        type: 'chatbot_created',
        chatbotName: chatbot.name,
        description: 'Chatbot created',
        timestamp: chatbot.createdAt
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ activities: activities.slice(0, 10) });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}