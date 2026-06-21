import { NextResponse } from 'next/server';

import { shouldRedirectToOnboarding } from './middleware-onboarding';
/**
 * Parse the auth store persisted in a cookie/localStorage value that is
 * forwarded as the `eduai-auth` cookie.  Returns null when unauthenticated.
 */
function parseAuthCookie(req) {
    const raw = req.cookies.get('eduai-auth')?.value;
    if (!raw)
        {return null;}
    try {
        const parsed = JSON.parse(decodeURIComponent(raw));
        if (!parsed?.state?.isAuthenticated)
            {return null;}
        return parsed.state.user ?? {};
    }
    catch {
        return null;
    }
}
export function middleware(req) {
    const { pathname } = req.nextUrl;
    // Allow onboarding routes and auth routes through unconditionally
    const isOnboarding = pathname.startsWith('/onboarding');
    const isAuth = pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/reset-password') ||
        pathname.startsWith('/verify-email') ||
        pathname.startsWith('/2fa') ||
        pathname.startsWith('/join') ||
        pathname.startsWith('/verify') ||
        pathname.startsWith('/start') ||
        pathname === '/';
    if (isOnboarding || isAuth) {
        return NextResponse.next();
    }
    const user = parseAuthCookie(req);
    // If authenticated but onboarding not completed, redirect to wizard
    if (user && shouldRedirectToOnboarding(user)) {
        const url = req.nextUrl.clone();
        url.pathname = '/onboarding/step/1';
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         * - api routes
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
    ],
};
