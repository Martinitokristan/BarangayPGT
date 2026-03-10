import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Guest-only routes (redirect to / if already logged in)
    const guestRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
    if (user && guestRoutes.some(r => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Protected routes (redirect to /login if not logged in)
    const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    const isPublic = publicRoutes.some(r => pathname.startsWith(r));
    if (!user && !isPublic) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Admin routes
    if (pathname.startsWith('/admin')) {
        // We can't check DB role in middleware efficiently, so just ensure user is logged in.
        // AdminRoute component on the client-side will do the actual role check.
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
