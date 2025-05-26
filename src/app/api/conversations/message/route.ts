import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Chatbot } from '@/models/chatbot';
import { Conversation } from '@/models/conversation';
import { User } from '@/models/user';
import { Types } from 'mongoose';

interface MessageRequest {
  chatbotId: string;
  sessionId: string;
  message: string;
  visitorInfo?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    location?: any;
    device?: any;
  };
  metadata?: any;
}

// POST: Process incoming chat message
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    await connectDB();
    
    const { 
      chatbotId, 
      sessionId, 
      message, 
      visitorInfo = {},
      metadata = {} 
    }: MessageRequest = await request.json();

    // Validate required fields
    if (!chatbotId || !sessionId || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: chatbotId, sessionId, message' 
      }, { status: 400 });
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(chatbotId)) {
      return NextResponse.json({ error: 'Invalid chatbot ID' }, { status: 400 });
    }

    // Get chatbot configuration
    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    if (!chatbot.isActive) {
      return NextResponse.json({ error: 'Chatbot is inactive' }, { status: 403 });
    }

    // Check rate limiting
    if (chatbot.integration.rateLimiting.enabled) {
      const rateLimitCheck = await checkRateLimit(chatbotId, sessionId, chatbot.integration.rateLimiting);
      if (!rateLimitCheck.allowed) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter 
        }, { status: 429 });
      }
    }

    // Check user's message limits
    const chatbotOwner = await User.findById(chatbot.userId);
    if (!chatbotOwner) {
      return NextResponse.json({ error: 'Chatbot owner not found' }, { status: 404 });
    }

    // Check monthly message limits
    const subscriptionLimits = {
      free: 100,
      pro: 10000,
      enterprise: -1 // unlimited
    };
    
    const monthlyLimit = subscriptionLimits[chatbotOwner.subscription.tier as keyof typeof subscriptionLimits];
    if (monthlyLimit !== -1 && chatbotOwner.usage.monthlyMessages >= monthlyLimit) {
      return NextResponse.json({ 
        error: 'Monthly message limit exceeded',
        message: 'This chatbot has reached its monthly message limit. Please contact the website owner.'
      }, { status: 403 });
    }

    // Get or create conversation
    let conversation = await Conversation.findOne({
      chatbotId: new Types.ObjectId(chatbotId),
      sessionId: sessionId,
      status: { $in: ['active', 'transferred'] }
    });

    const isNewConversation = !conversation;
    
    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        chatbotId: new Types.ObjectId(chatbotId),
        sessionId: sessionId,
        visitorInfo: {
          ...visitorInfo,
          isReturning: false, // TODO: Implement returning visitor detection
          previousSessions: 0
        },
        messages: [],
        status: 'active',
        startedAt: new Date(),
        lastActivityAt: new Date(),
        analytics: {
          messageCount: 0,
          userMessageCount: 0,
          botMessageCount: 0,
          avgResponseTime: 0,
          handoffRequested: false,
          goalCompleted: false
        }
      });
    }

    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user' as const,
      content: message.trim(),
      timestamp: new Date(),
      metadata: {
        ...metadata,
        processingTime: 0 // Will be calculated later
      }
    };

    conversation.messages.push(userMessage);

    // Process message and generate response
    const botResponse = await processMessage(message, chatbot, conversation, metadata);
    
    // Add bot response message
    const botMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'bot' as const,
      content: botResponse.content,
      timestamp: new Date(),
      metadata: {
        confidence: botResponse.confidence,
        flowId: botResponse.flowId,
        nodeId: botResponse.nodeId,
        aiGenerated: botResponse.aiGenerated,
        processingTime: Date.now() - startTime,
        buttons: botResponse.buttons,
        attachments: botResponse.attachments
      }
    };

    conversation.messages.push(botMessage);

    // Update conversation analytics
    conversation.analytics.messageCount = conversation.messages.length;
    conversation.analytics.userMessageCount = conversation.messages.filter((m: { type: string; }) => m.type === 'user').length;
    conversation.analytics.botMessageCount = conversation.messages.filter((m: { type: string; }) => m.type === 'bot').length;
    
    // Update last activity
    conversation.lastActivityAt = new Date();

    // Handle lead capture if email/phone detected
    if (botResponse.leadData) {
      conversation.lead = {
        ...conversation.lead,
        ...botResponse.leadData
      };
    }

    // Save conversation
    await conversation.save();

    // Update chatbot analytics
    await updateChatbotAnalytics(chatbot, conversation, isNewConversation, message);

    // Update user usage
    await User.findByIdAndUpdate(chatbotOwner._id, {
      $inc: { 
        'usage.monthlyMessages': 1,
        'usage.messages': 1
      }
    });

    // Prepare response
    const response = {
      success: true,
      message: botMessage,
      conversationId: conversation._id,
      sessionId: sessionId,
      metadata: {
        processingTime: Date.now() - startTime,
        isNewConversation,
        messageCount: conversation.messages.length
      }
    };

    // Send webhook if configured
    if (chatbot.integration.webhookUrl) {
      // Fire and forget webhook
      sendWebhook(chatbot.integration.webhookUrl, {
        event: 'message_received',
        chatbotId,
        conversationId: conversation._id,
        sessionId,
        message: userMessage,
        response: botMessage,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Webhook error:', err));
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Process message error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Message processing engine
async function processMessage(
  message: string, 
  chatbot: any, 
  conversation: any, 
  metadata: any
) {
  const startTime = Date.now();
  
  // 1. Check for active flows
  const flowResponse = await processFlows(message, chatbot.flows, conversation, metadata);
  if (flowResponse) {
    return {
      ...flowResponse,
      processingTime: Date.now() - startTime
    };
  }

  // 2. Check knowledge base
  const kbResponse = await processKnowledgeBase(message, chatbot.knowledgeBase);
  if (kbResponse) {
    return {
      ...kbResponse,
      processingTime: Date.now() - startTime
    };
  }

  // 3. AI processing (if enabled)
  if (chatbot.ai.enabled) {
    const aiResponse = await processAI(message, chatbot.ai, conversation);
    if (aiResponse) {
      return {
        ...aiResponse,
        aiGenerated: true,
        processingTime: Date.now() - startTime
      };
    }
  }

  // 4. Fallback response
  return {
    content: chatbot.config.fallbackMessage,
    confidence: 0.1,
    aiGenerated: false,
    processingTime: Date.now() - startTime
  };
}

// Flow processing
async function processFlows(message: string, flows: any[], conversation: any, metadata: any) {
  for (const flow of flows) {
    if (!flow.isActive) continue;

    // Check trigger conditions
    const triggered = checkFlowTrigger(message, flow.trigger, conversation, metadata);
    if (!triggered) continue;

    // Execute flow
    return await executeFlow(flow, message, conversation, metadata);
  }
  
  return null;
}

// Flow trigger checking
function checkFlowTrigger(message: string, trigger: any, conversation: any, metadata: any): boolean {
  const lowerMessage = message.toLowerCase();
  
  switch (trigger.type) {
    case 'keyword':
      return lowerMessage.includes(trigger.value.toLowerCase());
    
    case 'intent':
      // Simple intent matching - could be enhanced with NLP
      const intentKeywords = trigger.value.split(',').map((k: string) => k.trim().toLowerCase());
      return intentKeywords.some((keyword: string) => lowerMessage.includes(keyword));
    
    case 'condition':
      return evaluateCondition(trigger.conditions, { message, conversation, metadata });
    
    default:
      return false;
  }
}

// Execute flow logic
async function executeFlow(flow: any, message: string, conversation: any, metadata: any) {
  // Find starting node (first node or entry point)
  const startNode = flow.nodes.find((node: any) => 
    node.type === 'message' && node.connections.length === 0
  ) || flow.nodes[0];

  if (!startNode) {
    return null;
  }

  return await executeNode(startNode, flow.nodes, message, conversation, metadata);
}

// Execute individual node
async function executeNode(node: any, allNodes: any[], message: string, conversation: any, metadata: any): Promise<any> {
  switch (node.type) {
    case 'message':
      return {
        content: node.content.text || 'Hello!',
        confidence: 0.9,
        flowId: node.id,
        nodeId: node.id,
        buttons: node.content.buttons
      };

    case 'condition':
      const conditionMet = evaluateCondition([node.content.condition], { message, conversation, metadata });
      
      // Find next node based on condition result
      const nextNodeId = conditionMet ? node.connections[0] : node.connections[1];
      const nextNode = allNodes.find(n => n.id === nextNodeId);
      
      if (nextNode) {
        return await executeNode(nextNode, allNodes, message, conversation, metadata);
      }
      break;

    case 'input':
      // Handle input collection
      const leadData: any = {};
      
      if (node.content.inputType === 'email' && isValidEmail(message)) {
        leadData.email = message;
      } else if (node.content.inputType === 'phone' && isValidPhone(message)) {
        leadData.phone = message;
      }
      
      return {
        content: 'Thank you for providing that information!',
        confidence: 0.9,
        flowId: node.id,
        nodeId: node.id,
        leadData
      };

    case 'action':
      return await executeAction(node.content.action, message, conversation);

    case 'delay':
      // In a real implementation, this would trigger a delayed response
      return {
        content: 'Please wait a moment...',
        confidence: 0.9,
        flowId: node.id,
        nodeId: node.id,
        delay: node.content.delay
      };

    default:
      return null;
  }
}

// Execute action node
async function executeAction(action: any, message: string, conversation: any) {
  switch (action.type) {
    case 'collect_email':
      if (isValidEmail(message)) {
        return {
          content: action.message || 'Thank you for your email!',
          confidence: 0.9,
          leadData: { email: message }
        };
      }
      return {
        content: 'Please provide a valid email address.',
        confidence: 0.8
      };

    case 'collect_phone':
      if (isValidPhone(message)) {
        return {
          content: action.message || 'Thank you for your phone number!',
          confidence: 0.9,
          leadData: { phone: message }
        };
      }
      return {
        content: 'Please provide a valid phone number.',
        confidence: 0.8
      };

    case 'redirect':
      return {
        content: action.message || 'I\'ll redirect you now.',
        confidence: 0.9,
        buttons: [{
          text: 'Continue',
          action: 'url',
          url: action.url
        }]
      };

    default:
      return {
        content: action.message || 'Action executed.',
        confidence: 0.7
      };
  }
}

// Knowledge base processing
async function processKnowledgeBase(message: string, knowledgeBase: any[]) {
  if (!knowledgeBase || knowledgeBase.length === 0) return null;

  const lowerMessage = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const item of knowledgeBase) {
    if (!item.isActive) continue;

    let score = 0;
    
    // Check question similarity
    const questionWords = item.question.toLowerCase().split(/\s+/);
    const messageWords = lowerMessage.split(/\s+/);
    
    const commonWords = questionWords.filter((word:any) => 
      messageWords.some(mWord => mWord.includes(word) || word.includes(mWord))
    );
    
    score += (commonWords.length / questionWords.length) * 0.6;

    // Check keyword matches
    if (item.keywords && item.keywords.length > 0) {
      const keywordMatches = item.keywords.filter((keyword: string) => 
        lowerMessage.includes(keyword.toLowerCase())
      );
      score += (keywordMatches.length / item.keywords.length) * 0.4;
    }

    // Apply confidence multiplier
    score *= item.confidence;

    if (score > bestScore && score > 0.3) { // Minimum threshold
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch) {
    return {
      content: bestMatch.answer,
      confidence: bestScore,
      kbItemId: bestMatch.id
    };
  }

  return null;
}

// AI processing (placeholder - would integrate with OpenAI/Anthropic)
async function processAI(message: string, aiConfig: any, conversation: any) {
  // This would integrate with actual AI providers
  // For now, return a simple response
  
  if (!aiConfig.enabled) return null;

  try {
    // Placeholder for AI integration
    // const aiResponse = await callAIProvider(message, aiConfig, conversation);
    
    return {
      content: `I understand you're asking about: "${message}". Let me help you with that.`,
      confidence: 0.7,
      aiGenerated: true
    };
  } catch (error) {
    console.error('AI processing error:', error);
    
    if (aiConfig.fallbackToRules) {
      return null; // Let it fall back to knowledge base
    }
    
    return {
      content: 'I\'m having trouble processing your request right now. Please try again.',
      confidence: 0.3,
      aiGenerated: true
    };
  }
}

// Utility functions
function evaluateCondition(conditions: any[], context: any): boolean {
  if (!conditions || conditions.length === 0) return false;
  
  return conditions.every(condition => {
    const { field, operator, value } = condition;
    const fieldValue = getFieldValue(field, context);
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(value.toLowerCase());
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(value.toLowerCase());
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(value.toLowerCase());
      default:
        return false;
    }
  });
}

function getFieldValue(field: string, context: any): any {
  switch (field) {
    case 'user_input':
      return context.message;
    case 'message_count':
      return context.conversation?.messages?.length || 0;
    case 'session_duration':
      return context.conversation ? Date.now() - new Date(context.conversation.startedAt).getTime() : 0;
    default:
      return '';
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

// Rate limiting check
async function checkRateLimit(chatbotId: string, sessionId: string, rateLimiting: any) {
  // This would use Redis or similar for production
  // For now, return allowed
  return { allowed: true, retryAfter: 0 };
}

// Update chatbot analytics
async function updateChatbotAnalytics(chatbot: any, conversation: any, isNewConversation: boolean, message: string) {
  const updates: any = {};

  if (isNewConversation) {
    updates['$inc'] = { 'analytics.totalConversations': 1 };
  }

  // Update total messages
  updates['$inc'] = { 
    ...updates['$inc'],
    'analytics.totalMessages': 1 
  };

  // Update top questions
  const questionUpdate = {
    question: message.length > 100 ? message.substring(0, 100) + '...' : message,
    count: 1,
    lastAsked: new Date()
  };

  await Chatbot.findByIdAndUpdate(chatbot._id, updates);
}

// Send webhook notification
async function sendWebhook(webhookUrl: string, data: any) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Chatbot-Builder-Webhook/1.0'
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
  } catch (error) {
    console.error('Webhook delivery failed:', error);
    // In production, you might want to queue failed webhooks for retry
  }
}