'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAuth?: boolean;
    requireEmailVerification?: boolean;
    requireSubscription?: boolean;
    requiredRole?: 'user' | 'admin';
    fallbackUrl?: string;
}

export default function ProtectedRoute({
    children,
    requireAuth = true,
    requireEmailVerification = false,
    requireSubscription = false,
    requiredRole,
    fallbackUrl = '/auth/signin'
}: ProtectedRouteProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        // Check authentication
        if (requireAuth && !session) {
            router.push(fallbackUrl);
            return;
        }

        // Check email verification
        if (requireEmailVerification && session && !session.user.emailVerified) {
            router.push('/auth/verify-email');
            return;
        }

        // Check role
        if (requiredRole && session?.user.role !== requiredRole) {
            router.push('/dashboard');
            return;
        }

        // Check subscription
        if (requireSubscription && session?.user.subscription.status !== 'active') {
            router.push('/dashboard/billing?message=subscription_required');
            return;
        }
    }, [session, status, router, requireAuth, requireEmailVerification, requireSubscription, requiredRole, fallbackUrl]);

    // Show loading state
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (requireAuth && !session) {
        return null;
    }

    if (requireEmailVerification && session && !session.user.emailVerified) {
        return null;
    }

    if (requiredRole && session?.user.role !== requiredRole) {
        return null;
    }

    if (requireSubscription && session?.user.subscription.status !== 'active') {
        return null;
    }

    return <>{children}</>;
}