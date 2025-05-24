import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    _id: Schema.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    avatar?: string;
    emailVerified: boolean;
    role: 'user' | 'admin';

    // Subscription Information
    subscription: {
        tier: 'free' | 'pro' | 'enterprise';
        status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete';
        razorpayCustomerId?: string;
        razorpaySubscriptionId?: string;
        currentPeriodStart?: Date;
        currentPeriodEnd?: Date;
        cancelAtPeriodEnd: boolean;
        trialEnd?: Date;
    };

    // Usage Tracking
    usage: {
        chatbots: number;
        messages: number;
        monthlyMessages: number;
        lastResetDate: Date;
        apiCalls: number;
        storage: number; // in MB
    };

    // Settings & Preferences
    settings: {
        notifications: {
            email: boolean;
            newMessages: boolean;
            monthlyReports: boolean;
            systemUpdates: boolean;
        };
        timezone: string;
        language: string;
        theme: 'light' | 'dark' | 'auto';
    };

    // Security
    security: {
        lastLogin?: Date;
        loginAttempts: number;
        lockedUntil?: Date;
        passwordResetToken?: string;
        passwordResetExpires?: Date;
        emailVerificationToken?: string;
        twoFactorEnabled: boolean;
        twoFactorSecret?: string;
    };

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt: Date;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    avatar: String,
    emailVerified: { type: Boolean, default: false },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    subscription: {
        tier: {
            type: String,
            enum: ['free', 'pro', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'past_due', 'trialing', 'incomplete'],
            default: 'active'
        },
        stripeCustomerId: String,
        stripeSubscriptionId: String,
        currentPeriodStart: Date,
        currentPeriodEnd: Date,
        cancelAtPeriodEnd: { type: Boolean, default: false },
        trialEnd: Date,
    },

    usage: {
        chatbots: { type: Number, default: 0, min: 0 },
        messages: { type: Number, default: 0, min: 0 },
        monthlyMessages: { type: Number, default: 0, min: 0 },
        lastResetDate: { type: Date, default: Date.now },
        apiCalls: { type: Number, default: 0, min: 0 },
        storage: { type: Number, default: 0, min: 0 },
    },

    settings: {
        notifications: {
            email: { type: Boolean, default: true },
            newMessages: { type: Boolean, default: true },
            monthlyReports: { type: Boolean, default: true },
            systemUpdates: { type: Boolean, default: false },
        },
        timezone: { type: String, default: 'UTC' },
        language: { type: String, default: 'en' },
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    },

    security: {
        lastLogin: Date,
        loginAttempts: { type: Number, default: 0 },
        lockedUntil: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        emailVerificationToken: String,
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: String,
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
});

// Indexes
// userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'subscription.razorpayCustomerId': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

// Pre-save middleware
userSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
