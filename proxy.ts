import { type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

// Keep the public landing page statically cacheable. The workspace and
// dashboard are where signed-in sessions will be used.
export const config = {
  matcher: ["/apps/:path*", "/dashboard/:path*"],
};
