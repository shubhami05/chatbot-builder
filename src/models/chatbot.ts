import mongoose, { Schema } from "mongoose";

export interface IChatbot extends Document {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    name: string;
    description?: string;
    avatar?: string;
    isActive: boolean;

    // Configuration
    config: {
        greeting: string;
        fallbackMessage: string;
        collectEmail: boolean;
        collectPhone: boolean;
        allowFileUpload: boolean;
        maxFileSize: number; // in MB
        allowedFileTypes: string[];
        autoReply: boolean;
        businessHours: {
            enabled: boolean;
            timezone: string;
            schedule: Array<{
                day: number; // 0-6 (Sunday-Saturday)
                start: string; // HH:MM format
                end: string;
                isOpen: boolean;
            }>;
            outsideHoursMessage: string;
        };
        language: string;
        responseDelay: number; // in milliseconds
    };

    // Visual Styling
    styling: {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        textColor: string;
        fontFamily: string;
        fontSize: number;
        borderRadius: number;
        position: 'bottom-right' | 'bottom-left' | 'center' | 'top-right' | 'top-left';
        width: number;
        height: number;
        buttonStyle: 'round' | 'square' | 'rounded';
        shadowEnabled: boolean;
        animationEnabled: boolean;
        customCSS?: string;
    };

    // Conversation Flows
    flows: Array<{
        id: string;
        name: string;
        description?: string;
        isActive: boolean;
        trigger: {
            type: 'keyword' | 'intent' | 'button' | 'condition' | 'webhook';
            value: string;
            conditions?: Array<{
                field: string;
                operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
                value: string;
            }>;
        };
        nodes: Array<{
            id: string;
            type: 'message' | 'condition' | 'action' | 'input' | 'delay' | 'webhook';
            position: { x: number; y: number };
            content: {
                text?: string;
                buttons?: Array<{
                    text: string;
                    value: string;
                    action: 'reply' | 'url' | 'phone' | 'email';
                    url?: string;
                }>;
                inputType?: 'text' | 'email' | 'phone' | 'number' | 'file';
                validation?: {
                    required: boolean;
                    pattern?: string;
                    minLength?: number;
                    maxLength?: number;
                };
                delay?: number;
                webhookUrl?: string;
                condition?: {
                    field: string;
                    operator: string;
                    value: string;
                };
            };
            connections: string[]; // IDs of connected nodes
        }>;
        createdAt: Date;
        updatedAt: Date;
    }>;

    // Knowledge Base
    knowledgeBase: Array<{
        id: string;
        question: string;
        answer: string;
        keywords: string[];
        category: string;
        isActive: boolean;
        confidence: number;
        createdAt: Date;
        updatedAt: Date;
    }>;

    // Analytics
    analytics: {
        totalConversations: number;
        totalMessages: number;
        uniqueVisitors: number;
        averageSessionDuration: number;
        conversionRate: number;
        satisfactionScore: number;
        topQuestions: Array<{
            question: string;
            count: number;
            lastAsked: Date;
        }>;
        monthlyStats: Array<{
            month: string; // YYYY-MM format
            conversations: number;
            messages: number;
            visitors: number;
        }>;
    };

    // Integration Settings
    integration: {
        domains: string[]; // Allowed domains
        apiKey: string;
        webhookUrl?: string;
        webhookSecret?: string;
        embedCode: string;
        allowedOrigins: string[];
        rateLimiting: {
            enabled: boolean;
            requestsPerMinute: number;
            requestsPerHour: number;
        };
    };

    // AI Settings
    ai: {
        enabled: boolean;
        provider: 'openai' | 'anthropic' | 'custom';
        model: string;
        temperature: number;
        maxTokens: number;
        systemPrompt: string;
        fallbackToRules: boolean;
    };

    createdAt: Date;
    updatedAt: Date;
}

const chatbotSchema = new Schema<IChatbot>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Chatbot name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    avatar: String,
    isActive: { type: Boolean, default: true },

    config: {
        greeting: {
            type: String,
            default: 'Hello! How can I help you today?',
            maxlength: [500, 'Greeting message too long']
        },
        fallbackMessage: {
            type: String,
            default: 'I\'m sorry, I didn\'t understand that. Could you please rephrase?',
            maxlength: [500, 'Fallback message too long']
        },
        collectEmail: { type: Boolean, default: false },
        collectPhone: { type: Boolean, default: false },
        allowFileUpload: { type: Boolean, default: false },
        maxFileSize: { type: Number, default: 5, min: 1, max: 50 },
        allowedFileTypes: [{ type: String }],
        autoReply: { type: Boolean, default: true },
        businessHours: {
            enabled: { type: Boolean, default: false },
            timezone: { type: String, default: 'UTC' },
            schedule: [{
                day: { type: Number, min: 0, max: 6 },
                start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
                end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
                isOpen: { type: Boolean, default: true }
            }],
            outsideHoursMessage: {
                type: String,
                default: 'Thanks for your message! We\'ll get back to you during business hours.'
            }
        },
        language: { type: String, default: 'en' },
        responseDelay: { type: Number, default: 1000, min: 0, max: 10000 }
    },

    styling: {
        primaryColor: { type: String, default: '#007bff' },
        secondaryColor: { type: String, default: '#6c757d' },
        backgroundColor: { type: String, default: '#ffffff' },
        textColor: { type: String, default: '#333333' },
        fontFamily: { type: String, default: 'Inter, sans-serif' },
        fontSize: { type: Number, default: 14, min: 10, max: 24 },
        borderRadius: { type: Number, default: 8, min: 0, max: 50 },
        position: {
            type: String,
            enum: ['bottom-right', 'bottom-left', 'center', 'top-right', 'top-left'],
            default: 'bottom-right'
        },
        width: { type: Number, default: 350, min: 250, max: 600 },
        height: { type: Number, default: 500, min: 300, max: 800 },
        buttonStyle: { type: String, enum: ['round', 'square', 'rounded'], default: 'round' },
        shadowEnabled: { type: Boolean, default: true },
        animationEnabled: { type: Boolean, default: true },
        customCSS: String
    },

    flows: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: String,
        isActive: { type: Boolean, default: true },
        trigger: {
            type: {
                type: String,
                enum: ['keyword', 'intent', 'button', 'condition', 'webhook'],
                required: true
            },
            value: { type: String, required: true },
            conditions: [{
                field: String,
                operator: {
                    type: String,
                    enum: ['equals', 'contains', 'starts_with', 'ends_with', 'regex']
                },
                value: String
            }]
        },
        nodes: [{
            id: { type: String, required: true },
            type: {
                type: String,
                enum: ['message', 'condition', 'action', 'input', 'delay', 'webhook'],
                required: true
            },
            position: {
                x: { type: Number, required: true },
                y: { type: Number, required: true }
            },
            content: Schema.Types.Mixed,
            connections: [String]
        }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }],

    knowledgeBase: [{
        id: { type: String, required: true },
        question: { type: String, required: true },
        answer: { type: String, required: true },
        keywords: [String],
        category: String,
        isActive: { type: Boolean, default: true },
        confidence: { type: Number, default: 1.0, min: 0, max: 1 },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }],

    analytics: {
        totalConversations: { type: Number, default: 0 },
        totalMessages: { type: Number, default: 0 },
        uniqueVisitors: { type: Number, default: 0 },
        averageSessionDuration: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        satisfactionScore: { type: Number, default: 0 },
        topQuestions: [{
            question: String,
            count: { type: Number, default: 0 },
            lastAsked: Date
        }],
        monthlyStats: [{
            month: String,
            conversations: { type: Number, default: 0 },
            messages: { type: Number, default: 0 },
            visitors: { type: Number, default: 0 }
        }]
    },

    integration: {
        domains: [String],
        apiKey: {
            type: String,
            required: true,
            unique: true,
            default: () => `ak_${Math.random().toString(36).substr(2, 32)}`
        },
        webhookUrl: String,
        webhookSecret: String,
        embedCode: String,
        allowedOrigins: [String],
        rateLimiting: {
            enabled: { type: Boolean, default: true },
            requestsPerMinute: { type: Number, default: 60 },
            requestsPerHour: { type: Number, default: 1000 }
        }
    },

    ai: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, enum: ['openai', 'anthropic', 'custom'] },
        model: String,
        temperature: { type: Number, default: 0.7, min: 0, max: 2 },
        maxTokens: { type: Number, default: 150, min: 1, max: 4000 },
        systemPrompt: String,
        fallbackToRules: { type: Boolean, default: true }
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes
chatbotSchema.index({ userId: 1, isActive: 1 });
chatbotSchema.index({ 'integration.apiKey': 1 }, { unique: true });
chatbotSchema.index({ createdAt: -1 });
chatbotSchema.index({ 'analytics.totalConversations': -1 });

// Pre-save middleware
chatbotSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    // Generate embed code
    if (!this.integration.embedCode) {
        this.integration.embedCode = `<script src="${process.env.NEXT_PUBLIC_WIDGET_URL}" data-chatbot-id="${this._id}"></script>`;
    }

    next();
});

export const Chatbot = mongoose.models.Chatbot || mongoose.model<IChatbot>('Chatbot', chatbotSchema);
