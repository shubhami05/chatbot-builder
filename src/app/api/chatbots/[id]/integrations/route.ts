// app/api/chatbots/[id]/integration/route.ts
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

// GET: Get integration settings
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
    }).select('integration styling config name');

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    // Generate embed codes
    const baseUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com';
    const embedCodes = generateEmbedCodes(chatbot, baseUrl);

    return NextResponse.json({
      integration: chatbot.integration,
      embedCodes,
      chatbot: {
        name: chatbot.name,
        styling: chatbot.styling,
        config: chatbot.config
      }
    });

  } catch (error) {
    console.error('Get integration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration settings' },
      { status: 500 }
    );
  }
}

// PATCH: Update integration settings
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
    
    // Validate integration updates
    if (updates.integration) {
      const validationResult = validateIntegrationSettings(updates.integration);
      if (!validationResult.valid) {
        return NextResponse.json({ 
          error: validationResult.error 
        }, { status: 400 });
      }
    }

    // Check subscription limits for advanced features
    if (updates.integration?.webhookUrl && user.subscription.tier === 'free') {
      return NextResponse.json({ 
        error: 'Webhook integration requires Pro or Enterprise subscription' 
      }, { status: 403 });
    }

    // Generate webhook secret if webhook URL is being set for the first time
    if (updates.integration?.webhookUrl && !updates.integration?.webhookSecret) {
      updates.integration.webhookSecret = crypto.randomBytes(32).toString('hex');
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
      integration: chatbot.integration
    });

  } catch (error) {
    console.error('Update integration error:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid integration settings' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update integration settings' },
      { status: 500 }
    );
  }
}

// POST: Generate new API key
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    
    if (action !== 'regenerate-api-key') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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

    // Generate new API key
    const newApiKey = `ak_${crypto.randomBytes(32).toString('hex')}`;

    const chatbot = await Chatbot.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { 
        $set: { 
          'integration.apiKey': newApiKey,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      apiKey: newApiKey
    });

  } catch (error) {
    console.error('Regenerate API key error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate API key' },
      { status: 500 }
    );
  }
}

// Validation helper
function validateIntegrationSettings(integration: any) {
  // Validate domains
  if (integration.domains && Array.isArray(integration.domains)) {
    for (const domain of integration.domains) {
      if (typeof domain !== 'string' || !isValidDomain(domain)) {
        return { valid: false, error: `Invalid domain: ${domain}` };
      }
    }
  }

  // Validate webhook URL
  if (integration.webhookUrl && !isValidUrl(integration.webhookUrl)) {
    return { valid: false, error: 'Invalid webhook URL' };
  }

  // Validate rate limiting
  if (integration.rateLimiting) {
    const { requestsPerMinute, requestsPerHour } = integration.rateLimiting;
    
    if (requestsPerMinute && (requestsPerMinute < 1 || requestsPerMinute > 1000)) {
      return { valid: false, error: 'Requests per minute must be between 1 and 1000' };
    }
    
    if (requestsPerHour && (requestsPerHour < 1 || requestsPerHour > 100000)) {
      return { valid: false, error: 'Requests per hour must be between 1 and 100000' };
    }
  }

  // Validate allowed origins
  if (integration.allowedOrigins && Array.isArray(integration.allowedOrigins)) {
    for (const origin of integration.allowedOrigins) {
      if (typeof origin !== 'string' || !isValidUrl(origin)) {
        return { valid: false, error: `Invalid origin: ${origin}` };
      }
    }
  }

  return { valid: true };
}

// Helper functions
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.?[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function generateEmbedCodes(chatbot: any, baseUrl: string) {
  const chatbotId = chatbot._id.toString();
  
  return {
    javascript: generateJavaScriptCode(chatbot, baseUrl),
    react: generateReactCode(chatbot, baseUrl),
    wordpress: generateWordPressCode(chatbot, baseUrl),
    api: generateAPIDocumentation(chatbot, baseUrl)
  };
}

function generateJavaScriptCode(chatbot: any, baseUrl: string): string {
  return `<!-- ChatBot Builder - JavaScript Integration -->
<script>
  (function() {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = '${baseUrl}/api/widget/${chatbot._id}';
    s.setAttribute('data-chatbot-id', '${chatbot._id}');
    s.setAttribute('data-title', '${chatbot.name}');
    s.setAttribute('data-primary-color', '${chatbot.styling?.primaryColor || '#007bff'}');
    s.setAttribute('data-position', '${chatbot.styling?.position || 'bottom-right'}');
    s.setAttribute('data-greeting', '${chatbot.config?.greeting || 'Hello! How can I help you?'}');
    
    var x = document.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
  })();
</script>

<!-- Alternative: Direct script tag -->
<script 
  src="${baseUrl}/api/widget/${chatbot._id}"
  data-chatbot-id="${chatbot._id}"
  data-title="${chatbot.name}"
  data-primary-color="${chatbot.styling?.primaryColor || '#007bff'}"
  data-position="${chatbot.styling?.position || 'bottom-right'}"
  data-greeting="${chatbot.config?.greeting || 'Hello! How can I help you?'}"
  async>
</script>`;
}

function generateReactCode(chatbot: any, baseUrl: string): string {
  return `import React, { useEffect } from 'react';

// React Hook for ChatBot Integration
export function useChatBot(config) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${baseUrl}/api/widget/${chatbot._id}';
    script.async = true;
    
    Object.keys(config).forEach(key => {
      script.setAttribute(\`data-\${key.replace(/([A-Z])/g, '-$1').toLowerCase()}\`, config[key]);
    });
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (window.ChatBotBuilder) {
        window.ChatBotBuilder.destroy();
      }
    };
  }, [config]);
}

// React Component
export function ChatBotWidget({ 
  chatbotId = '${chatbot._id}',
  title = '${chatbot.name}',
  primaryColor = '${chatbot.styling?.primaryColor || '#007bff'}',
  position = '${chatbot.styling?.position || 'bottom-right'}',
  greeting = '${chatbot.config?.greeting || 'Hello! How can I help you?'}',
  ...props 
}) {
  const chatBotConfig = {
    chatbotId,
    title,
    primaryColor,
    position,
    greeting
  };
  
  useChatBot(chatBotConfig);
  return null;
}`;
}

function generateWordPressCode(chatbot: any, baseUrl: string): string {
  return `<?php
/**
 * Plugin Name: ChatBot Builder Integration
 * Description: Integrate ChatBot Builder widgets
 * Version: 1.0.0
 */

class ChatBotBuilderWP {
    private $chatbot_id = '${chatbot._id}';
    private $widget_url = '${baseUrl}';
    
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('chatbot_builder', array($this, 'shortcode'));
    }
    
    public function enqueue_scripts() {
        wp_enqueue_script(
            'chatbot-builder',
            $this->widget_url . '/api/widget/' . $this->chatbot_id,
            array(),
            '1.0.0',
            true
        );
    }
    
    public function shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => $this->chatbot_id,
            'title' => '${chatbot.name}',
            'position' => '${chatbot.styling?.position || 'bottom-right'}',
            'color' => '${chatbot.styling?.primaryColor || '#007bff'}'
        ), $atts);
        
        return $this->generate_widget_script($atts);
    }
}

new ChatBotBuilderWP();
?>`;
}

function generateAPIDocumentation(chatbot: any, baseUrl: string): string {
  return `# ChatBot Builder REST API

## Base URL
\`${process.env.NEXT_PUBLIC_API_URL || baseUrl}/api\`

## Send Message
\`\`\`http
POST /conversations/message
Content-Type: application/json

{
  "chatbotId": "${chatbot._id}",
  "sessionId": "unique-session-id",
  "message": "Hello!",
  "visitorInfo": {
    "url": "https://example.com",
    "userAgent": "Mozilla/5.0..."
  }
}
\`\`\``;
}