// app/api/chatbots/[id]/webhook/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongoose';
import { Chatbot } from '@/models/chatbot';
import { User } from '@/models/user';
import { Types } from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST: Test webhook endpoint
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    if (!chatbot.integration?.webhookUrl) {
      return NextResponse.json({ 
        error: 'No webhook URL configured' 
      }, { status: 400 });
    }

    // Test webhook
    const testResult = await testWebhook(
      chatbot.integration.webhookUrl,
      chatbot.integration.webhookSecret,
      chatbot._id.toString()
    );

    return NextResponse.json({
      success: testResult.success,
      status: testResult.status,
      responseTime: testResult.responseTime,
      error: testResult.error,
      response: testResult.response
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}

// Webhook testing function
async function testWebhook(webhookUrl: string, webhookSecret: string, chatbotId: string) {
  const startTime = Date.now();
  
  try {
    const testPayload = {
      event: 'webhook.test',
      chatbotId: chatbotId,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from ChatBot Builder',
        test: true
      }
    };

    const signature = generateWebhookSignature(
      JSON.stringify(testPayload),
      webhookSecret
    );

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ChatBot-Signature': signature,
        'X-ChatBot-Event': 'webhook.test',
        'User-Agent': 'ChatBot-Builder-Webhook/1.0'
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    return {
      success: response.ok,
      status: response.status,
      responseTime,
      response: {
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText.slice(0, 1000) // Limit response body size
      }
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      status: 0,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}
