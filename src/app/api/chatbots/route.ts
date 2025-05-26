import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongoose';
import { Chatbot } from '@/models/chatbot';
import { User } from '@/models/user';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
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

    // Check subscription limits
    const currentChatbots = await Chatbot.countDocuments({ userId: user._id });
    const subscriptionLimits = {
      free: 1,
      pro: 10,
      enterprise: -1 // unlimited
    };
    
    const maxChatbots = subscriptionLimits[user.subscription.tier as keyof typeof subscriptionLimits];
    if (maxChatbots !== -1 && currentChatbots >= maxChatbots) {
      return NextResponse.json({ 
        error: 'Chatbot limit reached. Please upgrade your subscription.' 
      }, { status: 403 });
    }

    const formData = await request.json();
    
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      return NextResponse.json({ error: 'Chatbot name is required' }, { status: 400 });
    }

    // Generate unique API key
    const apiKey = `ak_${Math.random().toString(36).substr(2, 32)}`;
    
    // Create chatbot with default values
    const chatbotData = {
      userId: user._id,
      name: formData.name.trim(),
      description: formData.description || '',
      avatar: formData.avatar || '',
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      
      config: {
        greeting: formData.config?.greeting || 'Hello! How can I help you today?',
        fallbackMessage: formData.config?.fallbackMessage || 'I\'m sorry, I didn\'t understand that. Could you please rephrase?',
        collectEmail: formData.config?.collectEmail || false,
        collectPhone: formData.config?.collectPhone || false,
        allowFileUpload: formData.config?.allowFileUpload || false,
        maxFileSize: formData.config?.maxFileSize || 5,
        allowedFileTypes: formData.config?.allowedFileTypes || ['jpg', 'png', 'pdf'],
        autoReply: formData.config?.autoReply !== false,
        businessHours: formData.config?.businessHours || {
          enabled: false,
          timezone: 'UTC',
          schedule: [],
          outsideHoursMessage: 'Thanks for your message! We\'ll get back to you during business hours.'
        },
        language: formData.config?.language || 'en',
        responseDelay: formData.config?.responseDelay || 1000
      },

      styling: {
        primaryColor: formData.styling?.primaryColor || '#007bff',
        secondaryColor: formData.styling?.secondaryColor || '#6c757d',
        backgroundColor: formData.styling?.backgroundColor || '#ffffff',
        textColor: formData.styling?.textColor || '#333333',
        fontFamily: formData.styling?.fontFamily || 'Inter, sans-serif',
        fontSize: formData.styling?.fontSize || 14,
        borderRadius: formData.styling?.borderRadius || 8,
        position: formData.styling?.position || 'bottom-right',
        width: formData.styling?.width || 350,
        height: formData.styling?.height || 500,
        buttonStyle: formData.styling?.buttonStyle || 'round',
        shadowEnabled: formData.styling?.shadowEnabled !== false,
        animationEnabled: formData.styling?.animationEnabled !== false,
        customCSS: formData.styling?.customCSS || ''
      },

      flows: formData.flows || [],
      knowledgeBase: formData.knowledgeBase || [],

      analytics: {
        totalConversations: 0,
        totalMessages: 0,
        uniqueVisitors: 0,
        averageSessionDuration: 0,
        conversionRate: 0,
        satisfactionScore: 0,
        topQuestions: [],
        monthlyStats: []
      },

      integration: {
        domains: formData.integration?.domains || [],
        apiKey: apiKey,
        webhookUrl: formData.integration?.webhookUrl || '',
        webhookSecret: formData.integration?.webhookSecret || '',
        embedCode: '', // Will be generated in pre-save middleware
        allowedOrigins: formData.integration?.allowedOrigins || [],
        rateLimiting: {
          enabled: formData.integration?.rateLimiting?.enabled !== false,
          requestsPerMinute: formData.integration?.rateLimiting?.requestsPerMinute || 60,
          requestsPerHour: formData.integration?.rateLimiting?.requestsPerHour || 1000
        }
      },

      ai: {
        enabled: formData.ai?.enabled || false,
        provider: formData.ai?.provider || 'openai',
        model: formData.ai?.model || 'gpt-3.5-turbo',
        temperature: formData.ai?.temperature || 0.7,
        maxTokens: formData.ai?.maxTokens || 150,
        systemPrompt: formData.ai?.systemPrompt || 'You are a helpful customer support assistant.',
        fallbackToRules: formData.ai?.fallbackToRules !== false
      }
    };

    const chatbot = new Chatbot(chatbotData);
    await chatbot.save();

    // Update user's chatbot count
    await User.findByIdAndUpdate(user._id, {
      $inc: { 'usage.chatbots': 1 }
    });

    return NextResponse.json({ 
      success: true,
      chatbot: {
        _id: chatbot._id,
        name: chatbot.name,
        description: chatbot.description,
        isActive: chatbot.isActive,
        createdAt: chatbot.createdAt
      }
    });

  } catch (error) {
    console.error('Create chatbot error:', error);
    
    // Handle duplicate API key error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Failed to generate unique API key. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create chatbot' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', or null for all
    
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId: user._id };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const [chatbots, total] = await Promise.all([
      Chatbot.find(query)
        .select('name description avatar isActive analytics createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Chatbot.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      chatbots,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get chatbots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chatbots' },
      { status: 500 }
    );
  }
}