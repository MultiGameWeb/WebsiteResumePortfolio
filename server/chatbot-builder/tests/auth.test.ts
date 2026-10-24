import { test } from "node:test";
import assert from "node:assert/strict";
import { getCurrentUserId, isAdmin, verifyOidcBearerToken } from "../adapters.js";
import worker from "../worker.js";
import type { Env } from "../types.js";

const TEST_NOW = 1_800_000_000;
const ISSUER = "https://accounts.example.test";
const AUDIENCE = "botcraft-web-client";

const keyPairPromise = crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
) as Promise<CryptoKeyPair>;

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const value of bytes) binary += String.fromCharCode(value);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function encodeJson(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function fixture(name: string) {
  const pair = await keyPairPromise;
  const jwksUrl = `https://keys.example.test/${name}/jwks`;
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  publicJwk.kid = "test-signing-key";
  publicJwk.use = "sig";
  publicJwk.alg = "RS256";
  const env: Env = {
    AUTH_ISSUER: ISSUER,
    AUTH_JWKS_URL: jwksUrl,
    AUTH_AUDIENCE: AUDIENCE,
    AUTH_ADMIN_SUBJECTS: "admin-subject-42",
  };
  let fetchCount = 0;
  const fetchImpl: typeof fetch = async input => {
    fetchCount++;
    assert.equal(String(input), jwksUrl);
    return Response.json({ keys: [publicJwk] }, { headers: { "Cache-Control": "public, max-age=300" } });
  };

  async function token(overrides: Record<string, unknown> = {}, headerOverrides: Record<string, unknown> = {}): Promise<string> {
    const header = { alg: "RS256", typ: "JWT", kid: "test-signing-key", ...headerOverrides };
    const claims = {
      iss: ISSUER,
      sub: "owner-subject-7",
      aud: AUDIENCE,
      iat: TEST_NOW - 5,
      exp: TEST_NOW + 300,
      ...overrides,
    };
    const signingInput = `${encodeJson(header)}.${encodeJson(claims)}`;
    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      pair.privateKey,
      new TextEncoder().encode(signingInput),
    );
    return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
  }

  function request(jwt?: string): Request {
    const headers = new Headers();
    if (jwt) headers.set("Authorization", `Bearer ${jwt}`);
    return new Request("https://botcraft.example/api/chatbot/ai", { method: "POST", headers });
  }

  return { env, fetchImpl, token, request, getFetchCount: () => fetchCount };
}

test("missing OIDC configuration and missing Bearer token fail closed without fetching keys", async () => {
  const env: Env = {};
  let fetchCalls = 0;
  const fetchImpl: typeof fetch = async () => { fetchCalls++; return Response.json({ keys: [] }); };
  const request = new Request("https://botcraft.example/api/chatbot/ai");
  assert.equal(await getCurrentUserId(request, env, fetchImpl), null);
  assert.equal(await isAdmin(request, env, fetchImpl), false);
  assert.equal(fetchCalls, 0);
});

test("valid RS256 OIDC token produces a stable owner ID from issuer and subject", async () => {
  const f = await fixture("valid-owner");
  const jwt = await f.token();
  const identity = await verifyOidcBearerToken(f.request(jwt), f.env, f.fetchImpl, TEST_NOW);
  assert.deepEqual(identity, { issuer: ISSUER, subject: "owner-subject-7" });
  assert.equal(await getCurrentUserId(f.request(jwt), f.env, f.fetchImpl), `oidc:${ISSUER}|owner-subject-7`);
});

test("issuer, audience, expiry, not-before, and future-issued claims are validated", async () => {
  const cases = [
    { name: "wrong-issuer", claims: { iss: "https://attacker.example.test" } },
    { name: "wrong-audience", claims: { aud: "other-client" } },
    { name: "expired", claims: { exp: TEST_NOW - 60 } },
    { name: "not-before", claims: { nbf: TEST_NOW + 60 } },
    { name: "future-issued", claims: { iat: TEST_NOW + 120 } },
  ];
  for (const item of cases) {
    const f = await fixture(item.name);
    const jwt = await f.token(item.claims);
    assert.equal(await verifyOidcBearerToken(f.request(jwt), f.env, f.fetchImpl, TEST_NOW), null, item.name);
  }
});

test("unsupported algorithms and token-supplied key URLs are rejected", async () => {
  const f = await fixture("unsupported-header");
  const badAlg = await f.token({}, { alg: "HS256" });
  const badKeyUrl = await f.token({}, { jku: "https://attacker.example.test/keys.json" });
  assert.equal(await verifyOidcBearerToken(f.request(badAlg), f.env, f.fetchImpl, TEST_NOW), null);
  assert.equal(await verifyOidcBearerToken(f.request(badKeyUrl), f.env, f.fetchImpl, TEST_NOW), null);
  assert.equal(f.getFetchCount(), 0);
});

test("tampered signature and unknown key IDs do not authenticate", async () => {
  const f = await fixture("tampering");
  const jwt = await f.token();
  const parts = jwt.split(".");
  parts[1] = encodeJson({ iss: ISSUER, sub: "admin-subject-42", aud: AUDIENCE, exp: TEST_NOW + 300 });
  assert.equal(await verifyOidcBearerToken(f.request(parts.join(".")), f.env, f.fetchImpl, TEST_NOW), null);

  const unknownKid = await f.token({}, { kid: "unknown-signing-key" });
  assert.equal(await verifyOidcBearerToken(f.request(unknownKid), f.env, f.fetchImpl, TEST_NOW), null);
  assert.ok(f.getFetchCount() >= 2);
});

test("admin authorization matches immutable subject IDs, never email addresses", async () => {
  const f = await fixture("admin-allowlist");
  const adminJwt = await f.token({ sub: "admin-subject-42", email: "someone@example.test" });
  const normalJwt = await f.token({ sub: "owner-subject-7", email: "admin@example.test" });
  assert.equal(await isAdmin(f.request(adminJwt), f.env, f.fetchImpl), true);
  assert.equal(await isAdmin(f.request(normalJwt), f.env, f.fetchImpl), false);
  f.env.AUTH_ADMIN_SUBJECTS = "admin@example.test";
  assert.equal(await isAdmin(f.request(adminJwt), f.env, f.fetchImpl), false);
});

test("protected routes deny access when OIDC is not configured", async () => {
  const env: Env = { DB: {
    prepare: () => ({
      bind: () => ({ first: async () => null, all: async () => ({ success: true, results: [] }), run: async () => ({ success: true }) }),
      first: async () => null,
      all: async () => ({ success: true, results: [] }),
      run: async () => ({ success: true }),
    }),
    batch: async () => [],
  } };
  const ctx = { waitUntil: (_promise: Promise<unknown>) => undefined };
  const adminResponse = await worker.fetch(
    new Request("https://botcraft.example/api/chatbot/admin/key-status"),
    env,
    ctx,
  );
  assert.equal(adminResponse.status, 403);

  const ownerResponse = await worker.fetch(
    new Request("https://botcraft.example/api/chatbot/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "chat" }),
    }),
    env,
    ctx,
  );
  assert.equal(ownerResponse.status, 401);
});

test("non-HTTPS identity-provider URLs fail closed", async () => {
  const f = await fixture("http-denied");
  f.env.AUTH_JWKS_URL = "http://keys.example.test/jwks";
  const jwt = await f.token();
  assert.equal(await verifyOidcBearerToken(f.request(jwt), f.env, f.fetchImpl, TEST_NOW), null);
  assert.equal(f.getFetchCount(), 0);
});
