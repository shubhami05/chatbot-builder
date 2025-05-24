import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardNavigation from '@/components/DashboardNavigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  if (!session.user.emailVerified) {
    redirect('/auth/verify-email');
  }

  return (
    <ProtectedRoute requireAuth requireEmailVerification>
      <div className="min-h-screen bg-gray-50">
        <DashboardNavigation />
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
