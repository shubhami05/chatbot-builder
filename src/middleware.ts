import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                            req.nextUrl.pathname.startsWith('/admin');
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // Allow auth routes and API auth routes
    if (isAuthPage || isApiAuthRoute) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !isAuth) {
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check admin access
    if (isAdminRoute && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Check email verification for protected routes
    if (isProtectedRoute && !token?.emailVerified) {
      return NextResponse.redirect(new URL('/auth/verify-email', req.url));
    }

    // Check subscription status for certain routes
    if (req.nextUrl.pathname.startsWith('/dashboard/chatbots/create')) {
      const subscription = token?.subscription;
      if (subscription?.status !== 'active') {
        const redirectUrl = new URL('/dashboard/billing', req.url);
        redirectUrl.searchParams.set('message', 'subscription_required');
        return NextResponse.redirect(redirectUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // This function runs for every request
        // Return true to allow the request, false to redirect to sign-in
        return true; // We handle authorization in the middleware function above
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/chatbots/:path*',
    '/api/subscription/:path*',
    '/api/analytics/:path*'
  ]
};