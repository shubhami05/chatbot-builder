'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Array<'user' | 'admin'>;
  fallback?: ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { data: session } = useSession();

  if (!session) {
    return fallback || null;
  }

  if (!allowedRoles.includes(session.user.role as 'user' | 'admin')) {
    return fallback || (
      <div className="text-center py-8">
        <p className="text-gray-500">You don't have permission to access this content.</p>
      </div>
    );
  }

  return <>{children}</>;
}