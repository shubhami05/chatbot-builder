import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Chatbot } from '@/models/chatbot';
import { Types } from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Serve the widget script dynamically
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid chatbot ID' }, { status: 400 });
    }

    // Get chatbot configuration
    const chatbot = await Chatbot.findById(params.id).select('name styling config integration isActive');
    
    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    if (!chatbot.isActive) {
      return NextResponse.json({ error: 'Chatbot is inactive' }, { status: 403 });
    }

    // Check domain restrictions
    const origin = request.headers.get('origin') || request.headers.get('referer');
    if (chatbot.integration.domains && chatbot.integration.domains.length > 0) {
      const isAllowed = chatbot.integration.domains.some((domain: string) => {
        return origin?.includes(domain);
      });
      
      if (!isAllowed) {
        return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
      }
    }

    // Generate widget script with configuration
    const widgetScript = generateWidgetScript(chatbot, params.id);

    return new NextResponse(widgetScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Widget script error:', error);
    return NextResponse.json(
      { error: 'Failed to load widget' },
      { status: 500 }
    );
  }
}

function generateWidgetScript(chatbot: any, chatbotId: string): string {
  const config = {
    chatbotId,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    title: chatbot.name,
    greeting: chatbot.config.greeting,
    primaryColor: chatbot.styling.primaryColor,
    position: chatbot.styling.position,
    width: chatbot.styling.width,
    height: chatbot.styling.height,
    borderRadius: chatbot.styling.borderRadius,
    fontFamily: chatbot.styling.fontFamily,
    fontSize: chatbot.styling.fontSize,
    responseDelay: chatbot.config.responseDelay,
  };

  return `
/**
 * ChatBot Builder Widget - Auto-generated
 * Chatbot ID: ${chatbotId}
 * Generated: ${new Date().toISOString()}
 */

(function() {
    'use strict';

    // Prevent multiple instances
    if (window.ChatBotBuilder_${chatbotId.replace(/[^a-zA-Z0-9]/g, '_')}) {
        return;
    }

    // Configuration
    const config = ${JSON.stringify(config, null, 4)};

    // Widget implementation
    class ChatBotWidget {
        constructor(config) {
            this.config = config;
            this.isOpen = false;
            this.isMinimized = false;
            this.sessionId = this.generateSessionId();
            this.messages = [];
            this.unreadCount = 0;
            this.isTyping = false;
            
            this.init();
        }

        generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        init() {
            this.createStyles();
            this.createWidget();
            this.bindEvents();
            this.visitorInfo = this.getVisitorInfo();
            
            // Send initial tracking
            this.trackVisitor();
        }

        createStyles() {
            const style = document.createElement('style');
            style.id = 'chatbot-widget-styles-${chatbotId}';
            style.textContent = \`
                .chatbot-widget-\${config.chatbotId.substr(-8)} {
                    position: fixed;
                    z-index: 2147483647;
                    font-family: \${config.fontFamily};
                    font-size: \${config.fontSize}px;
                    line-height: 1.4;
                    color: #333;
                    direction: ltr;
                    text-align: left;
                }

                .chatbot-widget-\${config.chatbotId.substr(-8)} * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                .chatbot-widget-\${config.chatbotId.substr(-8)}.position-\${config.position} {
                    \${this.getPositionStyles(config.position)}
                }

                .chatbot-toggle-btn-\${config.chatbotId.substr(-8)} {
                    width: 60px;
                    height: 60px;
                    border-radius: \${config.borderRadius}px;
                    background: \${config.primaryColor};
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .chatbot-toggle-btn-\${config.chatbotId.substr(-8)}:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                }

                .chatbot-window-\${config.chatbotId.substr(-8)} {
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: \${config.width}px;
                    height: \${config.height}px;
                    background: white;
                    border-radius: \${config.borderRadius}px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    display: flex;
                    flex-direction: column;
                    transform: scale(0) translateY(20px);
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    transform-origin: bottom right;
                    overflow: hidden;
                }

                .chatbot-window-\${config.chatbotId.substr(-8)}.open {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }

                .chatbot-header-\${config.chatbotId.substr(-8)} {
                    background: \${config.primaryColor};
                    color: white;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }

                .chatbot-messages-\${config.chatbotId.substr(-8)} {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: #f8f9fa;
                }

                .chatbot-message-\${config.chatbotId.substr(-8)} {
                    max-width: 80%;
                    word-wrap: break-word;
                    animation: fadeIn 0.3s ease;
                }

                .chatbot-message-\${config.chatbotId.substr(-8)}.bot {
                    align-self: flex-start;
                }

                .chatbot-message-\${config.chatbotId.substr(-8)}.user {
                    align-self: flex-end;
                }

                .chatbot-message-content-\${config.chatbotId.substr(-8)} {
                    padding: 12px 16px;
                    border-radius: 18px;
                    position: relative;
                }

                .chatbot-message-\${config.chatbotId.substr(-8)}.bot .chatbot-message-content-\${config.chatbotId.substr(-8)} {
                    background: white;
                    border: 1px solid #e1e5e9;
                }

                .chatbot-message-\${config.chatbotId.substr(-8)}.user .chatbot-message-content-\${config.chatbotId.substr(-8)} {
                    background: \${config.primaryColor};
                    color: white;
                }

                .chatbot-input-area-\${config.chatbotId.substr(-8)} {
                    padding: 16px 20px;
                    background: white;
                    border-top: 1px solid #e1e5e9;
                    flex-shrink: 0;
                }

                .chatbot-input-container-\${config.chatbotId.substr(-8)} {
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                    background: #f8f9fa;
                    border-radius: 20px;
                    padding: 8px 12px;
                    border: 1px solid #e1e5e9;
                    transition: border-color 0.2s;
                }

                .chatbot-input-\${config.chatbotId.substr(-8)} {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: none;
                    resize: none;
                    font-family: inherit;
                    font-size: \${config.fontSize}px;
                    line-height: 1.4;
                    max-height: 100px;
                    min-height: 20px;
                }

                .chatbot-send-btn-\${config.chatbotId.substr(-8)} {
                    background: \${config.primaryColor};
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                    flex-shrink: 0;
                }

                .chatbot-typing-\${config.chatbotId.substr(-8)} {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    background: white;
                    border-radius: 18px;
                    align-self: flex-start;
                    border: 1px solid #e1e5e9;
                }

                .chatbot-typing-dots-\${config.chatbotId.substr(-8)} {
                    display: flex;
                    gap: 3px;
                }

                .chatbot-typing-dot-\${config.chatbotId.substr(-8)} {
                    width: 6px;
                    height: 6px;
                    background: #8b95a1;
                    border-radius: 50%;
                    animation: typingBounce 1.4s infinite;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes typingBounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-10px); }
                }

                @media (max-width: 480px) {
                    .chatbot-window-\${config.chatbotId.substr(-8)} {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        width: 100%;
                        height: 100%;
                        border-radius: 0;
                        transform: translateY(100%);
                    }

                    .chatbot-window-\${config.chatbotId.substr(-8)}.open {
                        transform: translateY(0);
                    }
                }
            \`;
            document.head.appendChild(style);
        }

        getPositionStyles(position) {
            switch(position) {
                case 'bottom-right': return 'bottom: 20px; right: 20px;';
                case 'bottom-left': return 'bottom: 20px; left: 20px;';
                case 'top-right': return 'top: 20px; right: 20px;';
                case 'top-left': return 'top: 20px; left: 20px;';
                default: return 'bottom: 20px; right: 20px;';
            }
        }

        createWidget() {
            const widgetId = this.config.chatbotId.substr(-8);
            
            // Create container
            this.container = document.createElement('div');
            this.container.className = \`chatbot-widget-\${widgetId} position-\${this.config.position}\`;
            
            // Create toggle button
            this.toggleBtn = document.createElement('button');
            this.toggleBtn.className = \`chatbot-toggle-btn-\${widgetId}\`;
            this.toggleBtn.innerHTML = \`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
            \`;

            // Create chat window
            this.chatWindow = document.createElement('div');
            this.chatWindow.className = \`chatbot-window-\${widgetId}\`;
            this.chatWindow.innerHTML = \`
                <div class="chatbot-header-\${widgetId}">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 16px;">🤖</div>
                        <div>
                            <div style="font-weight: 600; font-size: 16px;">\${this.config.title}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Online</div>
                        </div>
                    </div>
                    <button style="background: none; border: none; color: white; cursor: pointer; padding: 4px;" onclick="this.closest('.chatbot-widget-\${widgetId}').chatbotInstance.closeWidget()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="chatbot-messages-\${widgetId}">
                    <div class="chatbot-message-\${widgetId} bot">
                        <div class="chatbot-message-content-\${widgetId}">\${this.config.greeting}</div>
                        <div style="font-size: 11px; color: #8b95a1; margin-top: 4px; text-align: center;">\${this.getCurrentTime()}</div>
                    </div>
                </div>
                
                <div class="chatbot-input-area-\${widgetId}">
                    <div class="chatbot-input-container-\${widgetId}">
                        <textarea class="chatbot-input-\${widgetId}" placeholder="Type your message..." rows="1"></textarea>
                        <button class="chatbot-send-btn-\${widgetId}" type="button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            \`;

            // Add to container
            this.container.appendChild(this.toggleBtn);
            this.container.appendChild(this.chatWindow);
            this.container.chatbotInstance = this;

            // Add to page
            document.body.appendChild(this.container);

            // Get references
            this.messagesContainer = this.chatWindow.querySelector(\`.chatbot-messages-\${widgetId}\`);
            this.input = this.chatWindow.querySelector(\`.chatbot-input-\${widgetId}\`);
            this.sendBtn = this.chatWindow.querySelector(\`.chatbot-send-btn-\${widgetId}\`);
        }

        bindEvents() {
            // Toggle button
            this.toggleBtn.addEventListener('click', () => {
                if (this.isOpen) {
                    this.closeWidget();
                } else {
                    this.openWidget();
                }
            });

            // Send button
            this.sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });

            // Input events
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        openWidget() {
            this.isOpen = true;
            this.chatWindow.classList.add('open');
            setTimeout(() => this.input.focus(), 300);
        }

        closeWidget() {
            this.isOpen = false;
            this.chatWindow.classList.remove('open');
        }

        async sendMessage() {
            const message = this.input.value.trim();
            if (!message) return;

            this.addMessage(message, 'user');
            this.input.value = '';
            this.showTyping();

            try {
                const response = await this.sendToAPI(message);
                this.hideTyping();
                
                if (response.message) {
                    setTimeout(() => {
                        this.addMessage(response.message.content, 'bot');
                    }, this.config.responseDelay || 1000);
                }
            } catch (error) {
                this.hideTyping();
                this.addMessage('Sorry, something went wrong. Please try again.', 'bot');
            }
        }

        async sendToAPI(message) {
            const response = await fetch(\`\${this.config.apiUrl}/conversations/message\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatbotId: this.config.chatbotId,
                    sessionId: this.sessionId,
                    message: message,
                    visitorInfo: this.visitorInfo
                })
            });

            if (!response.ok) throw new Error('API Error');
            return await response.json();
        }

        addMessage(content, type) {
            const widgetId = this.config.chatbotId.substr(-8);
            const messageDiv = document.createElement('div');
            messageDiv.className = \`chatbot-message-\${widgetId} \${type}\`;
            messageDiv.innerHTML = \`
                <div class="chatbot-message-content-\${widgetId}">\${this.escapeHtml(content)}</div>
                <div style="font-size: 11px; color: #8b95a1; margin-top: 4px; text-align: center;">\${this.getCurrentTime()}</div>
            \`;

            this.messagesContainer.appendChild(messageDiv);
            this.scrollToBottom();
        }

        showTyping() {
            if (this.typingIndicator) return;
            
            const widgetId = this.config.chatbotId.substr(-8);
            this.typingIndicator = document.createElement('div');
            this.typingIndicator.className = \`chatbot-typing-\${widgetId}\`;
            this.typingIndicator.innerHTML = \`
                <div class="chatbot-typing-dots-\${widgetId}">
                    <div class="chatbot-typing-dot-\${widgetId}"></div>
                    <div class="chatbot-typing-dot-\${widgetId}" style="animation-delay: 0.2s;"></div>
                    <div class="chatbot-typing-dot-\${widgetId}" style="animation-delay: 0.4s;"></div>
                </div>
                <span style="margin-left: 8px; color: #8b95a1; font-size: 12px;">Typing...</span>
            \`;

            this.messagesContainer.appendChild(this.typingIndicator);
            this.scrollToBottom();
        }

        hideTyping() {
            if (this.typingIndicator) {
                this.typingIndicator.remove();
                this.typingIndicator = null;
            }
        }

        scrollToBottom() {
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 100);
        }

        getCurrentTime() {
            return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        getVisitorInfo() {
            return {
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language
            };
        }

        async trackVisitor() {
            try {
                await fetch(\`\${this.config.apiUrl}/widget/track\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatbotId: this.config.chatbotId,
                        sessionId: this.sessionId,
                        visitorInfo: this.visitorInfo,
                        event: 'widget_loaded'
                    })
                });
            } catch (error) {
                // Silently fail tracking
            }
        }
    }

    // Initialize widget
    window.ChatBotBuilder_${chatbotId.replace(/[^a-zA-Z0-9]/g, '_')} = new ChatBotWidget(config);

})();
`;
}

function getPositionStyles(position: string): string {
  switch(position) {
    case 'bottom-right': return 'bottom: 20px; right: 20px;';
    case 'bottom-left': return 'bottom: 20px; left: 20px;';
    case 'top-right': return 'top: 20px; right: 20px;';
    case 'top-left': return 'top: 20px; left: 20px;';
    default: return 'bottom: 20px; right: 20px;';
  }
}