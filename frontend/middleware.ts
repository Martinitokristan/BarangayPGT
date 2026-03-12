import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next();

    const { pathname } = request.nextUrl;

    // ── Static / public assets — skip auth check entirely ──
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
    ) {
        return response;
    }

    // ── Guest-only pages: no auth check needed at all ──
    const guestRoutes = ['/login', '/register', '/verify-registration', '/verify-pending', '/forgot-password', '/reset-password'];
    const isGuestRoute = guestRoutes.some(r => pathname.startsWith(r));

    const token = request.cookies.get('token')?.value;

    // For guest routes (like login/register), redirect to home if already logged in
    if (isGuestRoute) {
        if (token) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return response;
    }

    // Public route that works with or without auth
    if (pathname === '/') {
        return response;
    }

    // Everything else requires a valid token
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
