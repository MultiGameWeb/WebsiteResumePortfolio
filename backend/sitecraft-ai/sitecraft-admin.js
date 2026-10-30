// The SiteCraft admin dashboard's API (control/index.html): totals, BotCraft
// bots and website sites, and a few owner-level fixes (bot buttons, pausing a
// bot). Every call needs "Authorization: Bearer <ADMIN_TOKEN>", a Worker
// secret; without the secret the API is off.
//
// GET  /api/admin/summary
// GET  /api/admin/bots?q=&offset=
// GET  /api/admin/bot?id=<shopId>
// POST /api/admin/bot  { id, action: "set_features" | "set_status", features?, status? }
// GET  /api/admin/sites?offset=
import { allowedOrigins, shopFeatures } from "./botcraft-builder.js";

const PAGE = 50;
const SHOP_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;
const FEATURE_KEYS = ["photo", "preorder", "orderStatus", "voice", "cart"];

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

// Compares in constant time so the token cannot be guessed byte by byte.
function sameSecret(given, expected) {
  const a = new TextEncoder().encode(String(given));
  const b = new TextEncoder().encode(String(expected));
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) diff |= (a[i] || 0) ^ (b[i] || 0);
  return diff === 0;
}

const failed = new Map();

function lockedOut(ip, now) {
  const recent = (failed.get(ip) || []).filter(t => now - t < 15 * 60000);
  failed.set(ip, recent);
  return recent.length >= 10;
}

async function all(db, sql, ...args) {
  return (await db.prepare(sql).bind(...args).all()).results || [];
}

async function first(db, sql, ...args) {
  return db.prepare(sql).bind(...args).first();
}

// A table may not exist yet on a fresh database; counts then read as 0.
async function count(db, sql, ...args) {
  try { return (await first(db, sql, ...args))?.n || 0; } catch { return 0; }
}

const parse = (text, fallback) => { try { return JSON.parse(text); } catch { return fallback; } };

async function summary(env) {
  const db = env.BOTCRAFT_DB;
  const week = new Date(Date.now() - 7 * 86400000).toISOString();
  const [bots, live, newBots, products, openQuestions, newRequests, ownerDevices] = await Promise.all([
    count(db, "SELECT COUNT(*) AS n FROM botcraft_shops"),
    count(db, "SELECT COUNT(*) AS n FROM botcraft_public"),
    count(db, "SELECT COUNT(*) AS n FROM botcraft_shops WHERE created_at > ?", week),
    count(db, "SELECT COUNT(*) AS n FROM botcraft_products"),
    count(db, "SELECT COUNT(*) AS n FROM botcraft_customer_questions WHERE status = 'open'"),
    count(db, "SELECT COUNT(*) AS n FROM botcraft_requests WHERE kind != 'order' AND status = 'new'"),
    count(db, "SELECT COUNT(DISTINCT endpoint) AS n FROM botcraft_push_subs WHERE role = 'owner'")
  ]);
  let types = [];
  try { types = await all(db, "SELECT shop_type, COUNT(*) AS n FROM botcraft_shops GROUP BY shop_type ORDER BY n DESC LIMIT 12"); } catch {}
  const sites = env.DB ? await count(env.DB, "SELECT COUNT(*) AS n FROM sites") : null;
  const leads = env.DB ? await count(env.DB, "SELECT COUNT(*) AS n FROM leads") : null;
  return { ok: true, botcraft: { bots, live, newBots, products, openQuestions, newRequests, ownerDevices, types }, websites: { sites, leads } };
}

async function listBots(env, url) {
  const db = env.BOTCRAFT_DB;
  const q = String(url.searchParams.get("q") || "").trim().slice(0, 80);
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const rows = await all(db,
    `SELECT s.shop_id, s.shop_name, s.shop_type, s.status, s.created_at, s.updated_at, p.public_id,
       (SELECT COUNT(*) FROM botcraft_answers a WHERE a.shop_id = s.shop_id) AS answers,
       (SELECT COUNT(*) FROM botcraft_products x WHERE x.shop_id = s.shop_id) AS products,
       (SELECT COUNT(*) FROM botcraft_customer_questions c WHERE c.shop_id = s.shop_id AND c.status = 'open') AS open_questions,
       (SELECT COUNT(*) FROM botcraft_requests r WHERE r.shop_id = s.shop_id AND r.kind != 'order' AND r.status = 'new') AS new_requests
     FROM botcraft_shops s LEFT JOIN botcraft_public p ON p.shop_id = s.shop_id
     WHERE (? = '' OR s.shop_name LIKE ? OR s.shop_type LIKE ? OR s.shop_id = ? OR p.public_id = ?)
     ORDER BY s.updated_at DESC LIMIT ? OFFSET ?`,
    q, like, like, q, q, PAGE + 1, offset);
  return { ok: true, bots: rows.slice(0, PAGE), more: rows.length > PAGE, offset };
}

async function botDetail(env, shopId) {
  const db = env.BOTCRAFT_DB;
  const shop = await first(db, "SELECT shop_id, shop_name, shop_type, status, facts_json, created_at, updated_at FROM botcraft_shops WHERE shop_id = ?", shopId);
  if (!shop) return null;
  const [pub, products, questions, requests, settings, messages, photos] = await Promise.all([
    first(db, "SELECT public_id FROM botcraft_public WHERE shop_id = ?", shopId),
    all(db, "SELECT name, price_text, stock_status, updated_at FROM botcraft_products WHERE shop_id = ? ORDER BY updated_at DESC LIMIT 100", shopId),
    all(db, "SELECT question, times, status, answer, last_at FROM botcraft_customer_questions WHERE shop_id = ? ORDER BY last_at DESC LIMIT 50", shopId).catch(() => []),
    all(db, "SELECT kind, code, message, status, reply, updated_at FROM botcraft_requests WHERE shop_id = ? ORDER BY updated_at DESC LIMIT 50", shopId).catch(() => []),
    first(db, "SELECT settings_json FROM botcraft_settings WHERE shop_id = ?", shopId).catch(() => null),
    count(db, "SELECT COUNT(*) AS n FROM botcraft_builder_messages WHERE shop_id = ?", shopId),
    all(db, "SELECT kind, COUNT(*) AS n FROM botcraft_photos WHERE shop_id = ? GROUP BY kind", shopId).catch(() => [])
  ]);
  const answers = await count(db, "SELECT COUNT(*) AS n FROM botcraft_answers WHERE shop_id = ?", shopId);
  return {
    ok: true,
    bot: {
      shopId: shop.shop_id, name: shop.shop_name, type: shop.shop_type, status: shop.status,
      createdAt: shop.created_at, updatedAt: shop.updated_at, publicId: pub?.public_id || null,
      facts: parse(shop.facts_json, {}), answers, setupMessages: messages,
      photos: Object.fromEntries(photos.map(p => [p.kind, p.n])),
      // What the customer bot shows now, including defaults for the business type.
      features: shopFeatures(shop.shop_type, parse(settings?.settings_json, {})),
      products, questions, requests
    }
  };
}

async function updateBot(env, body) {
  const db = env.BOTCRAFT_DB;
  const shopId = String(body?.id || "");
  if (!SHOP_ID_PATTERN.test(shopId) || !(await first(db, "SELECT 1 AS ok FROM botcraft_shops WHERE shop_id = ?", shopId))) return { status: 404, data: { ok: false, error: "Bot not found." } };
  const now = new Date().toISOString();
  if (body?.action === "set_status") {
    const status = body?.status === "disabled" ? "disabled" : "draft";
    await db.prepare("UPDATE botcraft_shops SET status = ?, updated_at = ? WHERE shop_id = ?").bind(status, now, shopId).run();
  } else if (body?.action === "set_features") {
    const row = await first(db, "SELECT settings_json FROM botcraft_settings WHERE shop_id = ?", shopId).catch(() => null);
    const settings = parse(row?.settings_json, {});
    const chosen = Object.fromEntries(FEATURE_KEYS.filter(k => typeof body?.features?.[k] === "boolean").map(k => [k, body.features[k]]));
    settings.features = { ...(settings.features || {}), ...chosen };
    await db.prepare("INSERT INTO botcraft_settings (shop_id, settings_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(shop_id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at")
      .bind(shopId, JSON.stringify(settings), now).run();
  } else {
    return { status: 400, data: { ok: false, error: "Unknown action." } };
  }
  return { status: 200, data: await botDetail(env, shopId) };
}

async function listSites(env, url) {
  if (!env.DB) return { ok: true, sites: [], more: false, configured: false };
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  try {
    const rows = await all(env.DB,
      `SELECT s.id, s.business_name, s.plan_gb, s.storage_used_bytes, s.storage_expires_at, s.status, s.created_at,
         (SELECT COUNT(*) FROM leads l WHERE l.site_id = s.id) AS leads
       FROM sites s ORDER BY s.created_at DESC LIMIT ? OFFSET ?`, PAGE + 1, offset);
    return { ok: true, sites: rows.slice(0, PAGE), more: rows.length > PAGE, offset, configured: true };
  } catch {
    return { ok: true, sites: [], more: false, configured: false };
  }
}

export async function handleAdminRoute(request, env, url) {
  const path = url.pathname.replace(/\/+$/, "");
  if (!path.startsWith("/api/admin/")) return null;
  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigins(env).has(origin)) return reply({ ok: false, error: "Origin not allowed." }, 403, origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  if (!env.ADMIN_TOKEN) return reply({ ok: false, error: "The admin dashboard is not set up yet (ADMIN_TOKEN secret is missing)." }, 503, origin);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  if (lockedOut(ip, now)) return reply({ ok: false, error: "Too many wrong keys. Try again in 15 minutes." }, 429, origin);
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || !sameSecret(token, env.ADMIN_TOKEN)) {
    failed.get(ip).push(now);
    return reply({ ok: false, error: "Wrong admin key." }, 401, origin);
  }
  if (!env.BOTCRAFT_DB) return reply({ ok: false, error: "BotCraft database is not connected." }, 503, origin);

  if (request.method === "GET" && path === "/api/admin/summary") return reply(await summary(env), 200, origin);
  if (request.method === "GET" && path === "/api/admin/bots") return reply(await listBots(env, url), 200, origin);
  if (request.method === "GET" && path === "/api/admin/bot") {
    const shopId = String(url.searchParams.get("id") || "");
    const detail = SHOP_ID_PATTERN.test(shopId) ? await botDetail(env, shopId) : null;
    return detail ? reply(detail, 200, origin) : reply({ ok: false, error: "Bot not found." }, 404, origin);
  }
  if (request.method === "POST" && path === "/api/admin/bot") {
    let body;
    try { body = await request.json(); } catch { return reply({ ok: false, error: "Request body must be JSON." }, 400, origin); }
    const result = await updateBot(env, body);
    return reply(result.data, result.status, origin);
  }
  if (request.method === "GET" && path === "/api/admin/sites") return reply(await listSites(env, url), 200, origin);
  return reply({ ok: false, error: "Unknown admin route." }, 404, origin);
}
