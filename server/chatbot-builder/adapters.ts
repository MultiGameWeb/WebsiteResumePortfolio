import type { Env, SupabaseClientLike } from "./types.js";

/**
 * These are the only three integration points with the existing SiteCraft app.
 * Stubs intentionally fail closed until the existing auth, Supabase client,
 * and isAdmin() implementation are connected.
 */
export async function getCurrentUserId(_request: Request): Promise<string | null> {
  // TODO: Connect to SiteCraft's existing current-user authentication.
  // Never trust a user ID supplied in the request body.
  return null;
}
export function getSupabase(_env: Env): SupabaseClientLike | null {
  // TODO: Return the existing server-side Supabase client/project.
  // Do not create a second database or client/auth system.
  return null;
}
export async function isAdmin(_request: Request): Promise<boolean> {
  // TODO: Connect to SiteCraft's existing isAdmin() authorization check.
  // Default-deny until connected.
  return false;
}
