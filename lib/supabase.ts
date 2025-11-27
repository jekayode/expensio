import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder values to prevent build-time errors.
// The client will fail at runtime if keys are still missing, but this allows the build to complete.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        "Missing Supabase environment variables. Please check your .env.local file or Cloudflare Pages settings (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
