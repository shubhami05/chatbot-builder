import 'next-auth'
import { DefaultSession } from 'next-auth';

interface Subscription {
    tier: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete';
    razorpayCustomerId?: string;
    razorpaySubscriptionId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
    trialEnd?: Date;
}
declare module 'next-auth' {

    interface User {
        _id?: string;
        role?: string;
        subscription?: Subscription;
        emailVerified?: boolean;
    }
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            image?: string;
            role: 'user' | 'admin';
            emailVerified: boolean;
            subscription: Subscription
            } & DefaultSession['user']
        }
    }

    declare module 'next-auth/jwt' {

        interface JWT {
            _id?: string;
            role?: string;
            subscription?: Subscription;
            emailVerified?: boolean; // Add this line
            lastRefresh?: number; // Add this line to track the last refresh time
        }
    }
