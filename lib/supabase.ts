// ============================================================
//  SUPABASE CLIENTS
//  - browserClient: anon key, used in client components
//  - serverClient:  service-role key, used in API routes only
// ============================================================
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser / client-component client (RLS applies — anon can only INSERT).
export function browserClient(): SupabaseClient {
  return createClient(url, anonKey, {
    realtime: { params: { eventsPerSecond: 5 } },
  });
}

// Server-only client with the service role key. NEVER import this into a
// client component — the service key bypasses RLS and must stay server-side.
export function serverClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
