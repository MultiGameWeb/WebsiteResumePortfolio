// Watermark-free exports for the video maker: a ₹99 "pass" paid with
// Razorpay, or a code the owner hands out.
//
// A pass lets the customer export watermark-free videos (MP4 or HTML) a few
// times within a day. The pass is a random code stored in D1; the browser
// keeps it in localStorage and sends it back to check it and to count an
// export.
//
//   GET  /api/aivideo/pay/config   -> { enabled, keyId, amount, currency, exports, hours }
//   POST /api/aivideo/pay/order    -> { orderId, amount, currency, keyId }  (creates a Razorpay order)
//   POST /api/aivideo/pay/verify   { orderId, paymentId, signature } -> { token, ... }
//   POST /api/aivideo/pay/recover  { orderId } -> { token, ... }  (paid but the tab closed)
//   POST /api/aivideo/pay/status   { token } -> { valid, left, expiresAt }
//   POST /api/aivideo/pay/redeem   { token } -> { ok, left }  (counts one export)
//   POST /api/aivideo/pay/grant    (Authorization: Bearer ADMIN_TOKEN) { exports?, hours? } -> { token }
//
// Worker secrets / variables:
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET   without them payments are off
//   AIVIDEO_PRICE_PAISE   default 9900 (₹99)
//   AIVIDEO_PASS_EXPORTS  default 5
//   AIVIDEO_PASS_HOURS    default 24
//
// Honest limit: the video is drawn in the customer's browser, so a determined
// person can remove the watermark by editing the page. This is a fair-use
// paywall for ordinary customers, not DRM.
import { allowedOrigins } from "./botcraft-builder.js";

const DEFAULT_PRICE = 9900;
const DEFAULT_EXPORTS = 5;
const DEFAULT_HOURS = 24;
const TOKEN_PATTERN = /^[a-f0-9]{32}$/;
const ORDER_PATTERN = /^order_[A-Za-z0-9]{8,40}$/;
const PAYMENT_PATTERN = /^pay_[A-Za-z0-9]{8,40}$/;

const settings = env => ({
  amount: Math.max(100, Number(env.AIVIDEO_PRICE_PAISE) || DEFAULT_PRICE),
  exports: Math.max(1, Number(env.AIVIDEO_PASS_EXPORTS) || DEFAULT_EXPORTS),
  hours: Math.max(1, Number(env.AIVIDEO_PASS_HOURS) || DEFAULT_HOURS)
});
const razorpayReady = env => Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

function headers(origin) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
const reply = (data, status, origin) => new Response(JSON.stringify(data), { status, headers: headers(origin) });

// Constant-time comparison.
function same(a, b) {
  const x = new TextEncoder().encode(String(a));
  const y = new TextEncoder().encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

const randomToken = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");

async function tables(db) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS aivideo_orders (order_id TEXT PRIMARY KEY, amount INTEGER NOT NULL, status TEXT NOT NULL, payment_id TEXT, token TEXT, created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS aivideo_passes (token TEXT PRIMARY KEY, max_uses INTEGER NOT NULL, uses INTEGER NOT NULL DEFAULT 0, expires_at TEXT NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL)")
  ]);
}

async function makePass(env, source, exportsLeft, hours) {
  const token = randomToken();
  const now = new Date();
  await env.BOTCRAFT_DB.prepare("INSERT INTO aivideo_passes (token, max_uses, uses, expires_at, source, created_at) VALUES (?, ?, 0, ?, ?, ?)")
    .bind(token, exportsLeft, new Date(now.getTime() + hours * 3600000).toISOString(), source, now.toISOString()).run();
  return token;
}

async function passInfo(env, token) {
  if (!TOKEN_PATTERN.test(String(token || ""))) return null;
  const row = await env.BOTCRAFT_DB.prepare("SELECT max_uses, uses, expires_at FROM aivideo_passes WHERE token = ?").bind(token).first();
  if (!row) return null;
  const left = Math.max(0, row.max_uses - row.uses);
  return { valid: left > 0 && new Date(row.expires_at).getTime() > Date.now(), left, expiresAt: row.expires_at };
}

async function razorpay(env, path, init = {}) {
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const response = await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Razorpay HTTP ${response.status}: ${data?.error?.description || ""}`);
  return data;
}

// Gives the pass for a paid order once; asking again returns the same pass.
async function passForPaidOrder(env, orderId, paymentId) {
  const db = env.BOTCRAFT_DB;
  const order = await db.prepare("SELECT status, token FROM aivideo_orders WHERE order_id = ?").bind(orderId).first();
  if (!order) return null;
  if (order.token) return order.token;
  const { exports, hours } = settings(env);
  const token = await makePass(env, "razorpay", exports, hours);
  // Only the first writer wins, so two requests never make two passes.
  const done = await db.prepare("UPDATE aivideo_orders SET status = 'paid', payment_id = ?, token = ? WHERE order_id = ? AND token IS NULL").bind(paymentId || null, token, orderId).run();
  if (!done.meta?.changes) return (await db.prepare("SELECT token FROM aivideo_orders WHERE order_id = ?").bind(orderId).first())?.token || null;
  return token;
}

const passReply = async (env, token) => ({ ok: true, token, ...(await passInfo(env, token)), hours: settings(env).hours });

const recent = new Map();
function throttled(ip, limit) {
  const now = Date.now();
  const list = (recent.get(ip) || []).filter(t => now - t < 60000);
  list.push(now);
  recent.set(ip, list);
  return list.length > limit;
}

export async function handleAiVideoPayRoute(request, env, url) {
  const path = url.pathname.replace(/\/+$/, "");
  if (!path.startsWith("/api/aivideo/pay/")) return null;
  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigins(env).has(origin)) return reply({ ok: false, error: "Origin not allowed." }, 403, origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  const action = path.slice("/api/aivideo/pay/".length);
  const { amount, exports, hours } = settings(env);

  if (action === "config" && request.method === "GET") {
    return reply({ ok: true, enabled: razorpayReady(env) && Boolean(env.BOTCRAFT_DB), keyId: razorpayReady(env) ? env.RAZORPAY_KEY_ID : "", amount, currency: "INR", exports, hours }, 200, origin);
  }
  if (request.method !== "POST") return reply({ ok: false, error: "Use POST." }, 405, origin);
  if (!env.BOTCRAFT_DB) return reply({ ok: false, error: "Passes are not available right now." }, 503, origin);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (throttled(ip, action === "redeem" || action === "status" ? 60 : 15)) return reply({ ok: false, error: "Too many requests. Please wait a minute." }, 429, origin);
  let body;
  try { body = await request.json(); } catch { body = {}; }
  await tables(env.BOTCRAFT_DB);

  try {
    if (action === "status") {
      const info = await passInfo(env, body.token);
      return reply({ ok: true, valid: Boolean(info?.valid), left: info?.left || 0, expiresAt: info?.expiresAt || null }, 200, origin);
    }

    if (action === "redeem") {
      // Counts one export, only if the pass is valid and has exports left.
      const token = String(body.token || "");
      if (!TOKEN_PATTERN.test(token)) return reply({ ok: false, error: "That code is not valid." }, 400, origin);
      const done = await env.BOTCRAFT_DB.prepare("UPDATE aivideo_passes SET uses = uses + 1 WHERE token = ? AND uses < max_uses AND expires_at > ?").bind(token, new Date().toISOString()).run();
      const info = await passInfo(env, token);
      if (!done.meta?.changes) return reply({ ok: false, error: info ? "This pass is used up or has expired." : "That code is not valid.", left: info?.left || 0 }, 402, origin);
      return reply({ ok: true, left: info.left, expiresAt: info.expiresAt }, 200, origin);
    }

    if (action === "grant") {
      const bearer = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!env.ADMIN_TOKEN || !bearer || !same(bearer, env.ADMIN_TOKEN)) return reply({ ok: false, error: "Not allowed." }, 401, origin);
      const token = await makePass(env, "admin", Math.min(200, Math.max(1, Number(body.exports) || exports)), Math.min(24 * 90, Math.max(1, Number(body.hours) || hours)));
      return reply(await passReply(env, token), 200, origin);
    }

    if (!razorpayReady(env)) return reply({ ok: false, error: "Payments are not switched on yet." }, 503, origin);

    if (action === "order") {
      const order = await razorpay(env, "/orders", { method: "POST", body: JSON.stringify({ amount, currency: "INR", receipt: `vid_${Date.now().toString(36)}`, notes: { product: "SiteCraft video pass" } }) });
      await env.BOTCRAFT_DB.prepare("INSERT INTO aivideo_orders (order_id, amount, status, created_at) VALUES (?, ?, 'created', ?)").bind(order.id, amount, new Date().toISOString()).run();
      return reply({ ok: true, orderId: order.id, amount, currency: "INR", keyId: env.RAZORPAY_KEY_ID }, 200, origin);
    }

    if (action === "verify") {
      const { orderId, paymentId, signature } = body;
      if (!ORDER_PATTERN.test(String(orderId || "")) || !PAYMENT_PATTERN.test(String(paymentId || "")) || !/^[a-f0-9]{64}$/.test(String(signature || ""))) return reply({ ok: false, error: "Payment details are not valid." }, 400, origin);
      // Razorpay signs "order_id|payment_id" with the key secret.
      const expected = await hmacHex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
      if (!same(expected, signature)) return reply({ ok: false, error: "We could not confirm this payment. If money was deducted, tap “I paid” to recover your pass." }, 400, origin);
      const token = await passForPaidOrder(env, orderId, paymentId);
      if (!token) return reply({ ok: false, error: "Order not found." }, 404, origin);
      return reply(await passReply(env, token), 200, origin);
    }

    if (action === "recover") {
      // The customer paid but the page closed before verify: ask Razorpay.
      const { orderId } = body;
      if (!ORDER_PATTERN.test(String(orderId || ""))) return reply({ ok: false, error: "Order not found." }, 400, origin);
      const known = await env.BOTCRAFT_DB.prepare("SELECT token FROM aivideo_orders WHERE order_id = ?").bind(orderId).first();
      if (!known) return reply({ ok: false, error: "Order not found." }, 404, origin);
      if (known.token) return reply(await passReply(env, known.token), 200, origin);
      const list = await razorpay(env, `/orders/${orderId}/payments`);
      const paid = (list.items || []).find(p => p.status === "captured");
      if (!paid) return reply({ ok: false, error: "No payment found for this order yet. Please wait a minute and try again." }, 402, origin);
      return reply(await passReply(env, await passForPaidOrder(env, orderId, paid.id)), 200, origin);
    }
  } catch (error) {
    console.error("AI video pay failed", action, error);
    return reply({ ok: false, error: "Payment service is busy. Please try again." }, 502, origin);
  }
  return reply({ ok: false, error: "Unknown route." }, 404, origin);
}
