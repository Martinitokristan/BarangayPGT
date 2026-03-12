import { createBrowserClient } from '@supabase/ssr';

// Singleton: reuse the same Supabase client across the entire app.
// createBrowserClient() allocates memory + sets up listeners each time,
// so calling it repeatedly wastes resources and causes race conditions.
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!client) {
        client = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return client;
}
