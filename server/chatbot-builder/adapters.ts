import type { D1DatabaseLike, Env } from "./types.js";

/**
 * BotCraft reuses SiteCraft's existing Cloudflare D1 database binding (DB).
 * This module is the only database/auth adapter boundary.
 *
 * The current static SiteCraft frontend has no trusted server-verified owner
 * identity API exposed to this separate Worker. Auth therefore defaults to deny.
 * Never trust a client-supplied user ID or a localStorage admin flag.
 */
export function getD1(env: Env): D1DatabaseLike | null {
  return env.DB ?? null;
}
export async function getCurrentUserId(_request: Request): Promise<string | null> {
  // TODO: Connect a real server-verified SiteCraft identity before enabling AI calls.
  return null;
}
export async function isAdmin(_request: Request): Promise<boolean> {
  // TODO: Connect a real server-verified admin check before enabling admin routes.
  return false;
}
