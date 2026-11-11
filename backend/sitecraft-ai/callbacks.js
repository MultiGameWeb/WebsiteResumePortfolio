// Executive call-back requests from the website checkout (domain setup, online payment setup).
// The success page sends one request per order; the owner dashboard lists them (sitecraft-admin.js).
//
// POST /api/requests/callback { name, phone, business, templateId, domain, onlinePayment, renewal, siteUrl }
//
// Stored in D1 (binding DB, sitecraft-db). The table is created on first use.

import { allowedOrigins } from "./botcraft-builder.js";

const SCHEMA = `CREATE TABLE IF NOT EXISTS callback_requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  business TEXT NOT NULL DEFAULT '',
  template_id TEXT NOT NULL DEFAULT '',
  wants_domain INTEGER NOT NULL DEFAULT 0,
  wants_online_payment INTEGER NOT NULL DEFAULT 0,
  site_url TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT ''
)`;

let ready = null;
export function ensureCallbackSchema(db) {
  if (!ready) ready = db.prepare(SCHEMA).run().catch(error => { ready = null; throw error; });
  return ready;
}

function headers(origin) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
const reply = (data, status, origin) => new Response(JSON.stringify(data), { status, headers: headers(origin) });

function origins(env) {
  const set = allowedOrigins(env);
  String(env?.HOSTING_ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean).forEach(o => set.add(o));
  return set;
}

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

export async function handleCallbackRoute(request, env, url) {
  if (url.pathname !== "/api/requests/callback") return null;
  const origin = request.headers.get("Origin") || "";
  if (!origins(env).has(origin)) return new Response(JSON.stringify({ ok: false, error: "Origin not allowed." }), { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  if (request.method !== "POST") return reply({ ok: false, error: "Use POST." }, 405, origin);
  if (!env.DB) return reply({ ok: false, error: "Storage is not configured." }, 503, origin);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 4000) return reply({ ok: false, error: "Request is too large." }, 413, origin);
    body = JSON.parse(raw);
  } catch {
    return reply({ ok: false, error: "Request must be valid JSON." }, 400, origin);
  }
  const phoneDigits = String(body?.phone || "").replace(/[^\d]/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 13) return reply({ ok: false, error: "Please enter a valid phone number." }, 400, origin);
  const wantsDomain = body?.domain === true;
  const wantsPayment = body?.onlinePayment === true;
  const renewal = body?.renewal === true;
  if (!wantsDomain && !wantsPayment && !renewal) return reply({ ok: false, error: "Nothing to request." }, 400, origin);

  const db = env.DB;
  await ensureCallbackSchema(db);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const since = new Date(Date.now() - 86400000).toISOString();
  const recent = await db.prepare("SELECT COUNT(*) AS n FROM callback_requests WHERE ip = ? AND created_at > ?").bind(ip, since).first();
  if (Number(recent?.n || 0) >= 10) return reply({ ok: false, error: "Too many requests today. Please try again tomorrow." }, 429, origin);

  const phone = clean(body.phone, 20);
  const kind = renewal ? "Hosting renewal" : "";
  // The same phone asking again for the same kind of help within a day updates that open request
  // instead of adding another; a renewal never replaces a domain / payment request.
  const open = await db.prepare("SELECT id FROM callback_requests WHERE phone = ? AND status = 'new' AND note = ? AND created_at > ? ORDER BY created_at DESC LIMIT 1").bind(phone, kind, since).first();
  const now = new Date().toISOString();
  const values = [clean(body.name, 80), clean(body.business, 120), clean(body.templateId, 40), wantsDomain ? 1 : 0, wantsPayment ? 1 : 0, clean(body.siteUrl, 300), kind];
  let id;
  if (open) {
    id = open.id;
    await db.prepare("UPDATE callback_requests SET name = ?, business = ?, template_id = ?, wants_domain = ?, wants_online_payment = ?, site_url = ?, note = ?, updated_at = ? WHERE id = ?")
      .bind(...values, now, id).run();
  } else {
    id = crypto.randomUUID();
    await db.prepare("INSERT INTO callback_requests (id, created_at, updated_at, status, name, business, template_id, wants_domain, wants_online_payment, site_url, note, phone, ip) VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, now, now, ...values, phone, ip).run();
  }
  return reply({ ok: true, id }, open ? 200 : 201, origin);
}
