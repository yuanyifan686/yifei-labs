"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Browser client for future signed-in user interactions. */
export function createSupabaseBrowserClient() {
  const { url, key } = requireSupabasePublicConfig();
  client ??= createBrowserClient(url, key);
  return client;
}
