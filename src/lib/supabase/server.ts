import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Server Component / Server Action client. Cookie writes are intentionally
 * ignored in Server Components; proxy.ts refreshes sessions on requests.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = requireSupabasePublicConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot persist cookies. The request proxy does.
        }
      },
    },
  });
}
