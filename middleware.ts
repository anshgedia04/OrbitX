import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Rate Limiting for Auth Routes
    if (path.startsWith('/api/auth')) {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        const record = rateLimit.get(ip) || { count: 0, lastReset: now };

        if (now - record.lastReset > RATE_LIMIT_WINDOW) {
            record.count = 0;
            record.lastReset = now;
        }

        record.count++;
        rateLimit.set(ip, record);

        if (record.count > MAX_REQUESTS) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
        }
    }

    // Protected Routes
    // Protect root "/" and specific app routes, but exclude public ones
    const isPublicPath =
        path === '/' ||
        path === '/login' ||
        path === '/signup' ||
        path === '/google-callback' ||
        path.startsWith('/shared') ||
        path.startsWith('/api/auth') ||
        path.startsWith('/api/shared') ||
        path.startsWith('/_next') ||
        path.startsWith('/favicon.ico') ||
        path.startsWith('/public');

    // Redirect authenticated users to dashboard if they visit public pages
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;

    if (token && (path === '/' || path === '/login' || path === '/signup')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (!isPublicPath) {
        if (!token) {
            // If accessing root or protected route without token, redirect to login
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');
            await jwtVerify(token, secret);
        } catch (error) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
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
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
