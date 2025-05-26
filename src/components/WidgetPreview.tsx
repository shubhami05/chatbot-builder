'use client';

import { useState, useEffect, useRef } from 'react';

interface WidgetPreviewProps {
    chatbotId: string;
    config?: {
        title?: string;
        greeting?: string;
        primaryColor?: string;
        position?: string;
        width?: number;
        height?: number;
    };
    onMessage?: (message: string) => void;
}

export default function WidgetPreview({ chatbotId, config = {}, onMessage }: WidgetPreviewProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{
        id: string;
        content: string;
        type: 'user' | 'bot';
        timestamp: Date;
    }>>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const widgetConfig = {
        title: config.title || 'Chat Support',
        greeting: config.greeting || 'Hello! How can I help you today?',
        primaryColor: config.primaryColor || '#007bff',
        position: config.position || 'bottom-right',
        width: config.width || 350,
        height: config.height || 500,
    };

    useEffect(() => {
        // Add initial greeting message
        if (messages.length === 0) {
            setMessages([{
                id: 'greeting',
                content: widgetConfig.greeting,
                type: 'bot',
                timestamp: new Date()
            }]);
        }
    }, [widgetConfig.greeting]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: `user_${Date.now()}`,
            content: inputValue.trim(),
            type: 'user' as const,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Call onMessage callback if provided
        if (onMessage) {
            onMessage(userMessage.content);
        }

        // Simulate bot response delay
        setTimeout(() => {
            setIsTyping(false);
            const botMessage = {
                id: `bot_${Date.now()}`,
                content: getBotResponse(userMessage.content),
                type: 'bot' as const,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
        }, 1500);
    };

    const getBotResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return 'Hello! Thanks for reaching out. How can I assist you today?';
        }

        if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
            return 'Our pricing starts at ₹999/month for the Pro plan. Would you like to see all our pricing options?';
        }

        if (lowerMessage.includes('help')) {
            return 'I\'m here to help! You can ask me about our features, pricing, or how to get started.';
        }

        return 'Thank you for your message! Our team will get back to you shortly. Is there anything else I can help you with?';
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getPositionClasses = () => {
        switch (widgetConfig.position) {
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'top-right':
                return 'top-4 right-4';
            case 'top-left':
                return 'top-4 left-4';
            default:
                return 'bottom-4 right-4';
        }
    };

    return (
        <div className="relative h-96 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {/* Preview Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🌐</div>
                    <p className="text-sm">Website Preview</p>
                    <p className="text-xs">Your chatbot will appear here</p>
                </div>
            </div>

            {/* Widget Container */}
            <div className={`absolute ${getPositionClasses()} z-10`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                    style={{ backgroundColor: widgetConfig.primaryColor }}
                >
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    )}
                </button>

                {/* Chat Window */}
                {isOpen && (
                    <div
                        className="absolute bottom-16 right-0 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-300"
                        style={{
                            width: Math.min(widgetConfig.width, 320),
                            height: Math.min(widgetConfig.height, 400)
                        }}
                    >
                        {/* Header */}
                        <div
                            className="p-4 text-white flex items-center justify-between"
                            style={{ backgroundColor: widgetConfig.primaryColor }}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm">🤖</span>
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">{widgetConfig.title}</div>
                                    <div className="text-xs opacity-90">Online</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className="max-w-[80%]">
                                        <div
                                            className={`px-3 py-2 rounded-lg text-sm ${message.type === 'user'
                                                    ? 'text-white rounded-br-sm'
                                                    : 'bg-white border rounded-bl-sm'
                                                }`}
                                            style={{
                                                backgroundColor: message.type === 'user' ? widgetConfig.primaryColor : undefined
                                            }}
                                        >
                                            {message.content}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 text-center">
                                            {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border rounded-lg px-3 py-2 flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500">Typing...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex items-end space-x-2">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Type your message..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        rows={1}
                                        style={{ minHeight: '36px', maxHeight: '100px' }}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim()}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: widgetConfig.primaryColor }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Powered By */}
                        <div className="px-4 py-2 bg-gray-50 border-t text-center">
                            <p className="text-xs text-gray-500">
                                Powered by <span className="font-medium">ChatBot Builder</span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Usage component for integration tab
export function WidgetIntegrationDemo({ chatbot }: { chatbot: any }) {
    const [activeDemo, setActiveDemo] = useState<'preview' | 'embed' | 'api'>('preview');

    const embedCode = `<script
  src="https://your-domain.com/api/widget/${chatbot._id}"
  data-chatbot-id="${chatbot._id}"
  data-title="${chatbot.name}"
  data-primary-color="${chatbot.styling?.primaryColor || '#007bff'}"
  data-position="${chatbot.styling?.position || 'bottom-right'}"
></script>`;

    const reactCode = `import { useEffect } from 'react';

function ChatWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/api/widget/${chatbot._id}';
    script.setAttribute('data-chatbot-id', '${chatbot._id}');
    script.setAttribute('data-title', '${chatbot.name}');
    script.setAttribute('data-primary-color', '${chatbot.styling?.primaryColor || '#007bff'}');
    script.setAttribute('data-position', '${chatbot.styling?.position || 'bottom-right'}');
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}`;

    const apiExample = `// Send message to chatbot
const response = await fetch('https://your-domain.com/api/conversations/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    chatbotId: '${chatbot._id}',
    sessionId: 'unique-session-id',
    message: 'Hello, I need help!',
    visitorInfo: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    }
  })
});

const data = await response.json();
console.log('Bot response:', data.message.content);`;

    return (
        <div className="space-y-6">
            {/* Demo Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveDemo('preview')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeDemo === 'preview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Live Preview
                    </button>
                    <button
                        onClick={() => setActiveDemo('embed')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeDemo === 'embed'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Embed Code
                    </button>
                    <button
                        onClick={() => setActiveDemo('api')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeDemo === 'api'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        API Usage
                    </button>
                </nav>
            </div>

            {/* Content */}
            {activeDemo === 'preview' && (
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Live Widget Preview</h3>
                    <p className="text-gray-600 mb-4">
                        Interact with your chatbot as your visitors would see it. Click the chat button to start a conversation.
                    </p>
                    <WidgetPreview
                        chatbotId={chatbot._id}
                        config={{
                            title: chatbot.name,
                            greeting: chatbot.config?.greeting,
                            primaryColor: chatbot.styling?.primaryColor,
                            position: chatbot.styling?.position,
                            width: chatbot.styling?.width,
                            height: chatbot.styling?.height,
                        }}
                    />
                </div>
            )}

            {activeDemo === 'embed' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">HTML Embed Code</h3>
                        <p className="text-gray-600 mb-4">
                            Copy and paste this code into your website, just before the closing &lt;/body&gt; tag.
                        </p>
                        <div className="relative">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{embedCode}</code>
                            </pre>
                            <button
                                onClick={() => navigator.clipboard.writeText(embedCode)}
                                className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">React Component</h3>
                        <p className="text-gray-600 mb-4">
                            For React applications, use this component to embed the chatbot.
                        </p>
                        <div className="relative">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{reactCode}</code>
                            </pre>
                            <button
                                onClick={() => navigator.clipboard.writeText(reactCode)}
                                className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeDemo === 'api' && (
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Direct API Usage</h3>
                    <p className="text-gray-600 mb-4">
                        Use our REST API to send messages directly to your chatbot from your application.
                    </p>
                    <div className="relative">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{apiExample}</code>
                        </pre>
                        <button
                            onClick={() => navigator.clipboard.writeText(apiExample)}
                            className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                        >
                            Copy
                        </button>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">API Documentation</h4>
                        <p className="text-blue-800 text-sm mb-2">
                            <strong>Endpoint:</strong> POST /api/conversations/message
                        </p>
                        <p className="text-blue-800 text-sm mb-2">
                            <strong>Authentication:</strong> No authentication required for public chatbots
                        </p>
                        <p className="text-blue-800 text-sm">
                            <strong>Rate Limits:</strong> {chatbot.integration?.rateLimiting?.requestsPerMinute || 60} requests per minute
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}