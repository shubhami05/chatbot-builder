'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import Link from 'next/link';

interface SubscriptionGuardProps {
  children: ReactNode;
  requiredTier?: 'free' | 'pro' | 'enterprise';
  requireActive?: boolean;
  fallback?: ReactNode;
}

export default function SubscriptionGuard({ 
  children, 
  requiredTier, 
  requireActive = true,
  fallback 
}: SubscriptionGuardProps) {
  const { data: session } = useSession();

  if (!session) {
    return fallback || null;
  }

  const { subscription } = session.user;
  
  // Check if subscription is active
  if (requireActive && subscription.status !== 'active') {
    return fallback || (
      <div className="text-center py-8 px-4">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Subscription Required
          </h3>
          <p className="text-gray-500 mb-4">
            You need an active subscription to access this feature.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Upgrade Your Plan
          </Link>
        </div>
      </div>
    );
  }

  // Check tier requirements
  if (requiredTier) {
    const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
    const userTierLevel = tierHierarchy[subscription.tier as keyof typeof tierHierarchy];
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      return fallback || (
        <div className="text-center py-8 px-4">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upgrade Required
            </h3>
            <p className="text-gray-500 mb-4">
              This feature requires a {requiredTier} plan or higher.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
            </Link>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}