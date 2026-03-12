/**
 * serverApi.ts
 *
 * Server-side data fetching helper for Next.js Server Components.
 * Attaches the Supabase JWT from the cookie-based server session to
 * every request so Laravel's SupabaseAuth middleware can authenticate it.
 *
 * Performance: uses getSession() (reads cookies, no network call)
 * instead of getUser() (network call to Supabase servers).
 */

import { createClient } from '@/lib/supabase/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function getBearerToken(): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getSession();
        return data?.session?.access_token ?? null;
    } catch {
        return null;
    }
}

async function serverFetch<T = any>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = await getBearerToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        // Disable Next.js full-route cache so the data is always fresh on each visit
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`API error ${res.status} for ${path}`);
    }

    return res.json() as Promise<T>;
}

export const serverApi = {
    get: <T = any>(path: string) => serverFetch<T>(path),
};
