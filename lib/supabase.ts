import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder values to prevent build-time errors.
// The client will fail at runtime if keys are still missing, but this allows the build to complete.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseKey);
