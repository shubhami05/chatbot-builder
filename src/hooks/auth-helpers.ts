import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest } from 'next/server';

export async function getAuthenticatedUser() {
    const session = await getServerSession(authOptions);
    return session?.user || null;
}

export async function requireAuth() {
    const user = await getAuthenticatedUser();
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
}

export async function requireRole(role: 'user' | 'admin') {
    const user = await requireAuth();
    if (user.role !== role) {
        throw new Error(`${role} role required`);
    }
    return user;
}

export async function requireEmailVerification() {
    const user = await requireAuth();
    if (!user.emailVerified) {
        throw new Error('Email verification required');
    }
    return user;
}

export async function requireActiveSubscription() {
    const user = await requireAuth();
    if (user.subscription.status !== 'active') {
        throw new Error('Active subscription required');
    }
    return user;
}

export async function requireSubscriptionTier(tier: 'free' | 'pro' | 'enterprise') {
    const user = await requireActiveSubscription();

    const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
    const userTierLevel = tierHierarchy[user.subscription.tier as keyof typeof tierHierarchy];
    const requiredTierLevel = tierHierarchy[tier];

    if (userTierLevel < requiredTierLevel) {
        throw new Error(`${tier} subscription tier required`);
    }

    return user;
}

// Rate limiting utility
export function createRateLimiter(windowMs: number, maxRequests: number) {
    const requests = new Map();

    return (identifier: string): boolean => {
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean up old entries
        for (const [key, timestamps] of requests.entries()) {
            const filtered = timestamps.filter((t: number) => t > windowStart);
            if (filtered.length === 0) {
                requests.delete(key);
            } else {
                requests.set(key, filtered);
            }
        }

        // Check current user's requests
        const userRequests = requests.get(identifier) || [];
        const recentRequests = userRequests.filter((t: number) => t > windowStart);

        if (recentRequests.length >= maxRequests) {
            return false; // Rate limit exceeded
        }

        // Add current request
        recentRequests.push(now);
        requests.set(identifier, recentRequests);

        return true; // Request allowed
    };
}

// Usage tracking utilities
export async function trackUserActivity(userId: string, activity: string) {
    try {
        // This could be expanded to use a proper analytics service
        console.log(`User ${userId} performed activity: ${activity}`);

        // Update last activity time
        await fetch('/api/auth/update-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, activity, timestamp: new Date() })
        });
    } catch (error) {
        console.error('Failed to track user activity:', error);
    }
}