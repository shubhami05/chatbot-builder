
// app/api/widget/analytics/route.ts

import connectDB from "@/lib/mongoose";
import { Chatbot } from "@/models/chatbot";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

// POST: Track widget analytics (for embed usage)
export async function POST(request: NextRequest) {
  try {
    const { chatbotId, event, sessionId, metadata } = await request.json();

    if (!chatbotId || !event) {
      return NextResponse.json({ 
        error: 'Missing required fields: chatbotId, event' 
      }, { status: 400 });
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(chatbotId)) {
      return NextResponse.json({ error: 'Invalid chatbot ID' }, { status: 400 });
    }

    await connectDB();

    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    // Track different types of widget events
    switch (event) {
      case 'widget_loaded':
        await Chatbot.findByIdAndUpdate(chatbotId, {
          $inc: { 'analytics.uniqueVisitors': 1 }
        });
        break;
        
      case 'widget_opened':
        // Could track widget open events
        break;
        
      case 'widget_closed':
        // Could track session duration
        break;
        
      default:
        // Track custom events
        break;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Widget analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}
