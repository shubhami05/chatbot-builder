
// app/api/chatbots/[id]/webhook/events/route.ts

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongoose";
import { Chatbot } from "@/models/chatbot";
import { User } from "@/models/user";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET: Get webhook event history
export async function GET(request: NextRequest, { params }:any) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const eventType = searchParams.get('event');

    // In a real implementation, you would store webhook events in a separate collection
    // For now, return mock data structure
    const mockEvents = generateMockWebhookEvents(chatbot._id.toString());
    
    const filteredEvents = eventType 
      ? mockEvents.filter(event => event.event === eventType)
      : mockEvents;

    const startIndex = (page - 1) * limit;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      events: paginatedEvents,
      pagination: {
        page,
        limit,
        total: filteredEvents.length,
        totalPages: Math.ceil(filteredEvents.length / limit)
      }
    });

  } catch (error) {
    console.error('Get webhook events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook events' },
      { status: 500 }
    );
  }
}

function generateMockWebhookEvents(chatbotId: string) {
  const events = [];
  const eventTypes = [
    'conversation.started',
    'conversation.ended', 
    'message.received',
    'lead.captured',
    'webhook.test'
  ];

  for (let i = 0; i < 20; i++) {
    const date = new Date(Date.now() - (i * 3600000)); // Past hours
    events.push({
      id: `evt_${Date.now()}_${i}`,
      event: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      chatbotId,
      timestamp: date.toISOString(),
      status: Math.random() > 0.1 ? 'delivered' : 'failed',
      responseTime: Math.floor(Math.random() * 2000) + 100,
      attempts: Math.random() > 0.8 ? 2 : 1,
      lastAttempt: date.toISOString(),
      response: {
        status: Math.random() > 0.1 ? 200 : 500,
        body: Math.random() > 0.1 ? 'OK' : 'Internal Server Error'
      }
    });
  }

  return events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
