
// app/api/chatbots/[id]/embed-stats/route.ts

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongoose";
import { Chatbot } from "@/models/chatbot";
import { User } from "@/models/user";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET: Get embed/integration statistics
export async function GET(request: NextRequest, { params }: any) {
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

    // Get embed statistics
    const stats = {
      totalEmbeds: chatbot.integration?.domains?.length || 0,
      allowedDomains: chatbot.integration?.domains || [],
      hasWebhook: !!chatbot.integration?.webhookUrl,
      rateLimiting: {
        enabled: chatbot.integration?.rateLimiting?.enabled || false,
        requestsPerMinute: chatbot.integration?.rateLimiting?.requestsPerMinute || 60,
        requestsPerHour: chatbot.integration?.rateLimiting?.requestsPerHour || 1000
      },
      widgetLoads: chatbot.analytics?.uniqueVisitors || 0,
      lastUpdated: chatbot.updatedAt
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Get embed stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch embed statistics' },
      { status: 500 }
    );
  }
}