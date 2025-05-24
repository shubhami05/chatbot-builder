'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
    const { data: session, update } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resending'>('loading');
    const [message, setMessage] = useState('');
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            verifyToken(token);
        } else if (session?.user.emailVerified) {
            router.push('/dashboard');
        } else {
            setStatus('error');
            setMessage('Please check your email for the verification link.');
        }
    }, [token, session, router]);

    const verifyToken = async (verificationToken: string) => {
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: verificationToken }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('Email verified successfully! Redirecting to dashboard...');

                // Update session to reflect email verification
                await update();

                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Verification failed');
            }
        } catch (error) {
            setStatus('error');
            setMessage('An error occurred during verification');
        }
    };

    const resendVerificationEmail = async () => {
        if (!session?.user?.email) return;

        setStatus('resending');
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session.user.email }),
            });

            if (response.ok) {
                setMessage('Verification email sent! Please check your inbox.');
            } else {
                setMessage('Failed to resend verification email. Please try again.');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        } finally {
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    {status === 'loading' && (
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    )}

                    {status === 'success' && (
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}

                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {status === 'success' ? 'Email Verified!' : 'Verify Your Email'}
                    </h2>

                    <p className="mt-2 text-center text-sm text-gray-600">
                        {message}
                    </p>

                    {!token && session && (
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={resendVerificationEmail}
                                disabled={status === 'resending'}
                                className={`font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded disabled:opacity-50 disabled:cursor-not-allowed transition`}
                            >
                                {status === 'resending' ? 'Sending...' : 'Resend verification email'}
                            </button>
                        </div>
                    )}

                    {
                        status === 'error' && (
                            <div className="mt-4 text-center text-sm text-red-600">
                                Something went wrong. Please try again.
                            </div>
                        )
                    }

                </div>
            </div>
        </div>
    );
}