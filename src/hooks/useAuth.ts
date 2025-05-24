import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(options: {
    required?: boolean;
    redirectTo?: string;
    redirectIfFound?: boolean;
} = {}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { required = false, redirectTo = '/auth/signin', redirectIfFound = false } = options;

    useEffect(() => {
        if (status === 'loading') return;

        if (required && !session) {
            router.push(redirectTo);
        }

        if (redirectIfFound && session) {
            router.push('/dashboard');
        }
    }, [session, status, required, redirectTo, redirectIfFound, router]);

    return {
        user: session?.user,
        session,
        loading: status === 'loading',
        isAuthenticated: !!session,
    };
}