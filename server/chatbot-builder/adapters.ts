import type { D1DatabaseLike, Env } from "./types.js";

/**
 * Authentication boundary for BotCraft.
 * Only a verified RS256 bearer JWT from the configured OIDC issuer/audience is
 * trusted. Identity is never accepted from query strings, request JSON, custom
 * headers, localStorage, or a client-supplied owner ID. Errors fail closed.
 */
interface JwtHeader {
  alg?: unknown; kid?: unknown; typ?: unknown;
}
interface JwtClaims {
  iss?: unknown; sub?: unknown; aud?: unknown; exp?: unknown;
  nbf?: unknown; iat?: unknown; azp?: unknown;
}
interface JwksDocument { keys?: JsonWebKey[]; }
interface CachedJwks { keys: JsonWebKey[]; expiresAt: number; }

const JWKS_TTL_MS = 5 * 60 * 1000;
const JWKS_MAX_BYTES = 256_000;
const MAX_TOKEN_CHARS = 16_384;
const CLOCK_SKEW_SECONDS = 30;
const jwksCache = new Map<string, CachedJwks>();

export function getD1(env: Env): D1DatabaseLike | null {
  return env.DB ?? null;
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function configuredHttpsUrl(value: string | undefined): URL | null {
  if (!value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > MAX_TOKEN_CHARS) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function parseJsonSegment<T>(segment: string): T | null {
  const bytes = decodeBase64Url(segment);
  if (!bytes) return null;
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

function sameAudience(claim: unknown, expected: string): boolean {
  if (typeof claim === "string") return claim === expected;
  return Array.isArray(claim) && claim.length > 0 &&
    claim.every(item => typeof item === "string") && claim.includes(expected);
}

async function loadJwks(url: string, fetchImpl: typeof fetch, forceRefresh = false): Promise<JsonWebKey[] | null> {
  const now = Date.now();
  const cached = jwksCache.get(url);
  if (!forceRefresh && cached && cached.expiresAt > now) return cached.keys;
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (text.length > JWKS_MAX_BYTES) return null;
    const parsed = record(JSON.parse(text)) as JwksDocument | null;
    if (!parsed || !Array.isArray(parsed.keys) || parsed.keys.length < 1 || parsed.keys.length > 100) return null;
    const keys = parsed.keys.filter((key): key is JsonWebKey =>
      !!key && typeof key === "object" && !Array.isArray(key) &&
      typeof key.kid === "string" && key.kid.length <= 256 &&
      key.kty === "RSA" && (!key.use || key.use === "sig") &&
      (!key.alg || key.alg === "RS256") &&
      typeof key.n === "string" && typeof key.e === "string"
    );
    if (keys.length === 0) return null;
    jwksCache.set(url, { keys, expiresAt: now + JWKS_TTL_MS });
    return keys;
  } catch {
    return null;
  }
}

function readAuthConfig(env: Env): { issuer: string; audience: string; jwksUrl: string } | null {
  const issuerUrl = configuredHttpsUrl(env.AUTH_ISSUER);
  const jwksUrl = configuredHttpsUrl(env.AUTH_JWKS_URL);
  const audience = env.AUTH_AUDIENCE?.trim();
  if (!issuerUrl || !jwksUrl || !audience || audience.length > 512) return null;
  if (issuerUrl.search || issuerUrl.hash) return null;
  // Match the issuer claim exactly after URL normalization; common OIDC issuers
  // that use a bare HTTPS host (such as accounts.google.com) remain supported.
  const issuer = issuerUrl.href.replace(/\/$/, "");
  return { issuer, audience, jwksUrl: jwksUrl.href };
}

export async function verifyOidcBearerToken(
  request: Request,
  env: Env,
  fetchImpl: typeof fetch = fetch,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<{ issuer: string; subject: string } | null> {
  const config = readAuthConfig(env);
  if (!config) return null;

  const authorization = request.headers.get("Authorization");
  if (!authorization || authorization.length > MAX_TOKEN_CHARS + 16 || !authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  if (!token || token.length > MAX_TOKEN_CHARS) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const header = parseJsonSegment<JwtHeader>(parts[0]);
  const claims = parseJsonSegment<JwtClaims>(parts[1]);
  const signature = decodeBase64Url(parts[2]);
  if (!header || !claims || !signature) return null;
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid || header.kid.length > 256) return null;
  // Key URLs and critical extensions are never accepted from the token itself.
  if ("jku" in header || "x5u" in header || "crit" in header) return null;

  if (claims.iss !== config.issuer || !sameAudience(claims.aud, config.audience)) return null;
  if (typeof claims.sub !== "string" || !claims.sub.trim() || claims.sub.length > 255) return null;
  if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || claims.exp <= nowSeconds - CLOCK_SKEW_SECONDS) return null;
  if (claims.nbf !== undefined && (typeof claims.nbf !== "number" || !Number.isFinite(claims.nbf) || claims.nbf > nowSeconds + CLOCK_SKEW_SECONDS)) return null;
  if (claims.iat !== undefined && (typeof claims.iat !== "number" || !Number.isFinite(claims.iat) || claims.iat > nowSeconds + 60)) return null;
  if (Array.isArray(claims.aud) && claims.aud.length > 1 && claims.azp !== config.audience) return null;

  let keys = await loadJwks(config.jwksUrl, fetchImpl);
  if (!keys) return null;
  let jwk = keys.find(key => key.kid === header.kid);
  if (!jwk) {
    keys = await loadJwks(config.jwksUrl, fetchImpl, true);
    if (!keys) return null;
    jwk = keys.find(key => key.kid === header.kid);
  }
  if (!jwk) return null;

  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
    );
    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const valid = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" }, publicKey, signature, signingInput,
    );
    if (!valid) return null;
  } catch {
    return null;
  }
  return { issuer: config.issuer, subject: claims.sub };
}

/** Stable owner key derived only from verified issuer + subject claims. */
export async function getCurrentUserId(request: Request, env: Env): Promise<string | null> {
  const identity = await verifyOidcBearerToken(request, env);
  return identity ? `oidc:${identity.issuer}|${identity.subject}` : null;
}

/** Admin authorization uses an explicit allowlist of immutable OIDC subject IDs, never email. */
export async function isAdmin(request: Request, env: Env): Promise<boolean> {
  const identity = await verifyOidcBearerToken(request, env);
  if (!identity) return false;
  const allowedSubjects = new Set(
    (env.AUTH_ADMIN_SUBJECTS ?? "").split(",").map(value => value.trim()).filter(Boolean),
  );
  return allowedSubjects.has(identity.subject);
}
