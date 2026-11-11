// SiteCraft auto hosting: publish a customer's website from the builder and serve it at
//   https://<worker-host>/s/<slug>/
// and, when HOSTING_DOMAIN is set and a wildcard route points at this Worker, at
//   https://<slug>.<HOSTING_DOMAIN>/
//
// Security model
// - The browser sends only the template id, the customer's data (JSON) and the selected features.
//   It never sends HTML or code. The template's code is fetched by the Worker from the SiteCraft
//   source (HOSTING_SOURCE_BASE), so a hosted page can only run genuine template code.
// - Uploaded photos arrive as data: URLs inside the data. They are pulled out and stored as files,
//   images only (plus the PDF/EPUB/audio types the author templates use), size-limited.
// - Each site gets a secret edit key on first publish. Only its SHA-256 hash is stored. Updating
//   a site needs the key.
// - New sites are rate-limited per IP. HOSTING_DISABLED="true" switches publishing off.
//   HOSTING_REQUIRE_PAYMENT="true" is reserved for when real payment is added: publishing is then
//   refused until payment verification is wired in.
//
// Storage: D1 (binding DB, sitecraft-db). Tables are created on first use; no manual migration.

import { allowedOrigins } from "./botcraft-builder.js";

const DEFAULT_SOURCE_BASE = "https://raw.githubusercontent.com/MultiGameWeb/WebsiteResumePortfolio/main/";
const TEMPLATE_ID = /^[a-z0-9][a-z0-9-]{1,40}$/;
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const RESERVED = new Set(["www", "api", "admin", "app", "mail", "sitecraft", "botcraft", "static", "assets", "cdn", "help", "support", "login", "billing", "pay", "payment", "dashboard", "test", "demo"]);
const MAX_BODY_BYTES = 24 * 1024 * 1024;
const MAX_FILE_BYTES = 1900 * 1024; // D1 row limit is 2 MB
const MAX_FILES = 40;
const MAX_SITE_BYTES = 20 * 1024 * 1024;
const MAX_DATA_JSON = 512 * 1024;
const DEFAULT_DAILY_NEW_SITES = 10;
const DAILY_UPDATES = 60;
const UPLOAD_TYPES = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "application/pdf": "pdf", "application/epub+zip": "epub",
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/wav": "wav", "audio/x-wav": "wav"
};
const MIME_BY_EXT = {
  html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8", txt: "text/plain; charset=utf-8",
  jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
  pdf: "application/pdf", epub: "application/epub+zip", mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav"
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS hosted_sites (
    slug TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    business_name TEXT NOT NULL DEFAULT '',
    edit_key_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'live',
    size_bytes INTEGER NOT NULL DEFAULT 0,
    created_ip TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS hosted_files (
    slug TEXT NOT NULL,
    path TEXT NOT NULL,
    mime TEXT NOT NULL,
    body BLOB NOT NULL,
    size_bytes INTEGER NOT NULL,
    PRIMARY KEY (slug, path)
  )`,
  `CREATE TABLE IF NOT EXISTS hosted_publish_log (
    day TEXT NOT NULL,
    ip TEXT NOT NULL,
    kind TEXT NOT NULL,
    n INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, ip, kind)
  )`
];

let schemaReady = null;
function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db.batch(SCHEMA.map(sql => db.prepare(sql))).catch(error => { schemaReady = null; throw error; });
  }
  return schemaReady;
}

const nowIso = () => new Date().toISOString();
const enc = new TextEncoder();

function cors(origin) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
const reply = (data, status, origin) => new Response(JSON.stringify(data), { status, headers: cors(origin) });

function hostingOrigins(env) {
  const extra = String(env?.HOSTING_ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
  const set = allowedOrigins(env);
  extra.forEach(o => set.add(o));
  return set;
}

export function slugify(value) {
  const s = String(value || "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 40).replace(/-+$/g, "");
  return s.length >= 3 ? s : (s ? s + "-site" : "my-site");
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function newEditKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function sourceBase(env) {
  const base = String(env?.HOSTING_SOURCE_BASE || DEFAULT_SOURCE_BASE);
  return base.endsWith("/") ? base : base + "/";
}

const sourceCache = new Map();
async function fetchSource(env, path) {
  const url = sourceBase(env) + path;
  const hit = sourceCache.get(url);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.text;
  const res = await fetch(url, { headers: { "User-Agent": "sitecraft-hosting" } });
  if (!res.ok) {
    const err = new Error("SOURCE_" + res.status);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  sourceCache.set(url, { at: Date.now(), text });
  return text;
}

function decodeDataUrl(value) {
  const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(value);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!UPLOAD_TYPES[mime]) return null;
  let bytes;
  if (m[2]) {
    const bin = atob(m[3].replace(/\s+/g, ""));
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } else {
    bytes = enc.encode(decodeURIComponent(m[3]));
  }
  return { mime, bytes };
}

// Replace every data: URL in the customer's data with a file path, like core/pack.js does for the
// downloaded package. Strings that are data: URLs of other types are dropped.
export function extractUploads(data) {
  const files = [];
  const seen = new Map();
  let n = 0;
  let problem = null;
  const walk = (v, depth) => {
    if (depth > 40) { problem = problem || "Data is nested too deeply."; return null; }
    if (typeof v === "string") {
      if (!/^data:/i.test(v)) return v;
      if (seen.has(v)) return seen.get(v);
      const file = decodeDataUrl(v);
      if (!file) { seen.set(v, ""); return ""; }
      if (file.bytes.length > MAX_FILE_BYTES) { problem = problem || "One of your photos or files is larger than 1.9 MB. Please use a smaller one."; return ""; }
      if (files.length >= MAX_FILES) { problem = problem || "Too many photos or files (the limit is " + MAX_FILES + ")."; return ""; }
      const path = "assets/uploads/file-" + (++n) + "." + UPLOAD_TYPES[file.mime];
      files.push({ path, mime: file.mime, bytes: file.bytes });
      seen.set(v, path);
      return path;
    }
    if (Array.isArray(v)) return v.map(x => walk(x, depth + 1));
    if (v && typeof v === "object") {
      const o = {};
      for (const k of Object.keys(v)) {
        if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
        o[k] = walk(v[k], depth + 1);
      }
      return o;
    }
    if (typeof v === "number" || typeof v === "boolean" || v === null) return v;
    return null;
  };
  const out = walk(data, 0);
  return { data: out, files, problem };
}

const escHtml = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const jsonForScript = v => JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export function buildIndexHtml(templateId, data, selected, templateName) {
  const brand = (data && data.brand) || {};
  const title = String(brand.businessName || templateName || "Website").slice(0, 120);
  const description = String(brand.tagline || (data && data.home && (data.home.subtitle || data.home.text)) || "").slice(0, 300);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + escHtml(title) + '</title>'
    + (description ? '<meta name="description" content="' + escHtml(description) + '">' : '')
    + '<meta property="og:title" content="' + escHtml(title) + '">'
    + '<link rel="stylesheet" href="templates/' + templateId + '/style.css">'
    + '<style>body{margin:0}#site .template-admin-link{display:none!important}.sc-loading{font:16px/1.5 system-ui,sans-serif;padding:48px 20px;text-align:center;color:#444}</style>'
    + '</head><body><div id="site"><p class="sc-loading">Loading ' + escHtml(title) + '…</p></div>'
    + '<noscript><p style="font:16px system-ui;padding:24px">Please turn on JavaScript to view this website.</p></noscript>'
    + '<script src="core/pack.js"></script>'
    + '<script type="module">'
    + 'const DATA=' + jsonForScript(data) + ',SELECTED=' + jsonForScript(selected) + ';'
    + 'const el=document.getElementById("site");'
    + 'try{const m=await import("./templates/' + templateId + '/template.js");'
    + 'el.innerHTML=m.render(DATA,SELECTED);'
    + 'if(window.SiteCraftPack)window.SiteCraftPack.sanitize(el);'
    + 'if(typeof m.init==="function")m.init(el,DATA,SELECTED);'
    + 'const h=location.hash&&document.getElementById(decodeURIComponent(location.hash.slice(1)));if(h)h.scrollIntoView();'
    + '}catch(e){console.error(e);el.innerHTML="<p class=\\"sc-loading\\">Sorry, this website could not load. Please refresh the page.</p>";}'
    + '</script></body></html>';
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
}

async function bumpCounter(db, ip, kind, limit) {
  const day = nowIso().slice(0, 10);
  const row = await db.prepare("SELECT n FROM hosted_publish_log WHERE day = ? AND ip = ? AND kind = ?").bind(day, ip, kind).first();
  if (row && Number(row.n) >= limit) return false;
  await db.prepare("INSERT INTO hosted_publish_log (day, ip, kind, n) VALUES (?, ?, ?, 1) ON CONFLICT(day, ip, kind) DO UPDATE SET n = n + 1").bind(day, ip, kind).run();
  return true;
}

async function pickFreeSlug(db, base) {
  let candidate = RESERVED.has(base) ? base + "-site" : base;
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? candidate : (candidate.slice(0, 36).replace(/-+$/, "") + "-" + (i + 1));
    const row = await db.prepare("SELECT slug FROM hosted_sites WHERE slug = ?").bind(slug).first();
    if (!row) return slug;
  }
  return candidate.slice(0, 30) + "-" + crypto.randomUUID().slice(0, 6);
}

export function siteUrls(env, requestUrl, slug) {
  const pathUrl = new URL("/s/" + slug + "/", requestUrl).href;
  const domain = String(env?.HOSTING_DOMAIN || "").trim().toLowerCase();
  return { url: domain ? "https://" + slug + "." + domain + "/" : pathUrl, pathUrl };
}

async function handlePublish(request, env, url, origin) {
  if (String(env.HOSTING_DISABLED || "") === "true") return reply({ ok: false, error: "Publishing is switched off right now. Please try again later." }, 503, origin);
  if (String(env.HOSTING_REQUIRE_PAYMENT || "") === "true") return reply({ ok: false, error: "PAYMENT_REQUIRED", message: "Please complete payment before publishing." }, 402, origin);
  if (!env.DB) return reply({ ok: false, error: "Hosting storage is not configured." }, 503, origin);

  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_BODY_BYTES) return reply({ ok: false, error: "Your website is too large to publish. Please use smaller photos." }, 413, origin);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return reply({ ok: false, error: "Your website is too large to publish. Please use smaller photos." }, 413, origin);
    body = JSON.parse(raw);
  } catch {
    return reply({ ok: false, error: "Request must be valid JSON." }, 400, origin);
  }
  if (!body || typeof body !== "object") return reply({ ok: false, error: "Request must be a JSON object." }, 400, origin);

  const templateId = String(body.templateId || "");
  if (!TEMPLATE_ID.test(templateId)) return reply({ ok: false, error: "Unknown template." }, 400, origin);
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) return reply({ ok: false, error: "Website details are missing." }, 400, origin);

  const db = env.DB;
  await ensureSchema(db);

  // Template files come from the SiteCraft source, never from the request.
  let manifestText, moduleText, styleText, packText;
  try {
    [manifestText, moduleText, styleText, packText] = await Promise.all([
      fetchSource(env, "templates/" + templateId + "/template.json"),
      fetchSource(env, "templates/" + templateId + "/template.js"),
      fetchSource(env, "templates/" + templateId + "/style.css"),
      fetchSource(env, "core/pack.js")
    ]);
  } catch (error) {
    if (error?.status === 404) return reply({ ok: false, error: "Unknown template." }, 400, origin);
    return reply({ ok: false, error: "Could not load the template. Please try again in a minute." }, 502, origin);
  }
  let manifest;
  try { manifest = JSON.parse(manifestText); } catch { return reply({ ok: false, error: "Template is damaged." }, 502, origin); }
  const featureIds = new Set((manifest.features || []).map(f => f && f.id).filter(Boolean));
  const selected = (Array.isArray(body.selected) ? body.selected : [...featureIds])
    .map(String).filter(id => featureIds.has(id) && id !== "play-games");

  const extracted = extractUploads(body.data);
  if (extracted.problem) return reply({ ok: false, error: extracted.problem }, 413, origin);
  const dataJson = JSON.stringify(extracted.data);
  if (dataJson.length > MAX_DATA_JSON) return reply({ ok: false, error: "Too much text in the website details." }, 413, origin);

  const businessName = String(extracted.data?.brand?.businessName || manifest.name || "").slice(0, 120);
  const index = buildIndexHtml(templateId, extracted.data, selected, manifest.name);
  const files = [
    { path: "index.html", mime: MIME_BY_EXT.html, bytes: enc.encode(index) },
    { path: "site-data.json", mime: MIME_BY_EXT.json, bytes: enc.encode(dataJson) },
    { path: "core/pack.js", mime: MIME_BY_EXT.js, bytes: enc.encode(packText) },
    { path: "templates/" + templateId + "/template.js", mime: MIME_BY_EXT.js, bytes: enc.encode(moduleText) },
    { path: "templates/" + templateId + "/style.css", mime: MIME_BY_EXT.css, bytes: enc.encode(styleText) },
    ...extracted.files
  ];
  if (files.some(f => f.bytes.length > MAX_FILE_BYTES)) return reply({ ok: false, error: "The template is too large to host." }, 413, origin);
  const total = files.reduce((n, f) => n + f.bytes.length, 0);
  if (total > MAX_SITE_BYTES) return reply({ ok: false, error: "Your website is larger than 20 MB. Please use smaller photos." }, 413, origin);

  const ip = clientIp(request);
  const now = nowIso();
  const requestedSlug = String(body.slug || "").trim().toLowerCase();
  const editKey = String(body.editKey || "");
  let slug;
  let createdKey = null;

  if (editKey) {
    // Update an existing site.
    if (!SLUG.test(requestedSlug)) return reply({ ok: false, error: "Website address is missing." }, 400, origin);
    const site = await db.prepare("SELECT slug, edit_key_hash, status FROM hosted_sites WHERE slug = ?").bind(requestedSlug).first();
    if (!site || !safeEqual(site.edit_key_hash, await sha256(editKey))) return reply({ ok: false, error: "This edit key does not match the website address." }, 403, origin);
    if (site.status === "blocked") return reply({ ok: false, error: "This website has been switched off. Please contact SiteCraft support." }, 403, origin);
    if (!(await bumpCounter(db, ip, "update", DAILY_UPDATES))) return reply({ ok: false, error: "Too many updates today. Please try again tomorrow." }, 429, origin);
    slug = site.slug;
  } else {
    const limit = Number(env.HOSTING_DAILY_LIMIT || DEFAULT_DAILY_NEW_SITES) || DEFAULT_DAILY_NEW_SITES;
    if (!(await bumpCounter(db, ip, "create", limit))) return reply({ ok: false, error: "Too many new websites from this connection today. Please try again tomorrow." }, 429, origin);
    const base = requestedSlug ? slugify(requestedSlug) : slugify(businessName || templateId);
    slug = await pickFreeSlug(db, base);
    createdKey = newEditKey();
  }

  const statements = [];
  if (createdKey) {
    statements.push(db.prepare(
      "INSERT INTO hosted_sites (slug, template_id, business_name, edit_key_hash, status, size_bytes, created_ip, created_at, updated_at) VALUES (?, ?, ?, ?, 'live', ?, ?, ?, ?)"
    ).bind(slug, templateId, businessName, await sha256(createdKey), total, ip, now, now));
  } else {
    statements.push(db.prepare("UPDATE hosted_sites SET template_id = ?, business_name = ?, size_bytes = ?, updated_at = ? WHERE slug = ?")
      .bind(templateId, businessName, total, now, slug));
  }
  statements.push(db.prepare("DELETE FROM hosted_files WHERE slug = ?").bind(slug));
  for (const f of files) {
    statements.push(db.prepare("INSERT INTO hosted_files (slug, path, mime, body, size_bytes) VALUES (?, ?, ?, ?, ?)")
      .bind(slug, f.path, f.mime, f.bytes, f.bytes.length));
  }
  try {
    await db.batch(statements);
  } catch (error) {
    return reply({ ok: false, error: "Could not save your website. Please try again.", detail: String(error?.message || error).slice(0, 200) }, 500, origin);
  }

  const urls = siteUrls(env, url, slug);
  return reply({
    ok: true,
    slug,
    url: urls.url,
    pathUrl: urls.pathUrl,
    created: Boolean(createdKey),
    ...(createdKey ? { editKey: createdKey } : {}),
    sizeBytes: total,
    files: files.length
  }, createdKey ? 201 : 200, origin);
}

// Lets a customer connect a website they published from another phone or computer, using its edit key.
async function handleVerify(request, env, url, origin) {
  if (!env.DB) return reply({ ok: false, error: "Hosting storage is not configured." }, 503, origin);
  let body;
  try { body = await request.json(); } catch { return reply({ ok: false, error: "Request must be valid JSON." }, 400, origin); }
  const slug = String(body?.slug || "").trim().toLowerCase();
  const editKey = String(body?.editKey || "").trim();
  if (!SLUG.test(slug) || !editKey || editKey.length > 100) return reply({ ok: false, error: "Please enter your website address and edit key." }, 400, origin);
  await ensureSchema(env.DB);
  if (!(await bumpCounter(env.DB, clientIp(request), "verify", 30))) return reply({ ok: false, error: "Too many tries today. Please try again tomorrow." }, 429, origin);
  const site = await env.DB.prepare("SELECT slug, template_id, edit_key_hash FROM hosted_sites WHERE slug = ?").bind(slug).first();
  if (!site || !safeEqual(site.edit_key_hash, await sha256(editKey))) return reply({ ok: false, error: "This edit key does not match the website address." }, 403, origin);
  return reply({ ok: true, slug: site.slug, templateId: site.template_id, url: siteUrls(env, url, site.slug).url }, 200, origin);
}

async function handleCheck(env, url, origin) {
  if (!env.DB) return reply({ ok: false, error: "Hosting storage is not configured." }, 503, origin);
  await ensureSchema(env.DB);
  const wanted = slugify(url.searchParams.get("slug") || "");
  const taken = RESERVED.has(wanted) || Boolean(await env.DB.prepare("SELECT slug FROM hosted_sites WHERE slug = ?").bind(wanted).first());
  const suggestion = taken ? await pickFreeSlug(env.DB, wanted) : wanted;
  return reply({ ok: true, slug: wanted, available: !taken, suggestion, url: siteUrls(env, url, suggestion).url }, 200, origin);
}

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https:",
  "img-src * data: blob:",
  "media-src * data: blob:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com",
  "connect-src 'self' https:",
  "form-action 'self' https:",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors *"
].join("; ");

function page(status, title, text) {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escHtml(title) + '</title></head><body style="font:16px/1.6 system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;color:#222"><h1 style="font-size:24px">' + escHtml(title) + '</h1><p>' + escHtml(text) + '</p></body></html>', {
    status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}

async function serveFile(request, env, slug, filePath) {
  if (!env.DB) return page(503, "Website unavailable", "Hosting storage is not configured.");
  if (!SLUG.test(slug)) return page(404, "Website not found", "Please check the address and try again.");
  await ensureSchema(env.DB);
  const site = await env.DB.prepare("SELECT status FROM hosted_sites WHERE slug = ?").bind(slug).first();
  if (!site) return page(404, "Website not found", "Please check the address and try again.");
  if (site.status !== "live") return page(410, "Website unavailable", "This website is not available right now.");
  let path = filePath || "index.html";
  if (path.endsWith("/")) path += "index.html";
  if (path.includes("..") || path.length > 200) return page(404, "Not found", "This page does not exist.");
  const row = await env.DB.prepare("SELECT mime, body, size_bytes FROM hosted_files WHERE slug = ? AND path = ?").bind(slug, path).first();
  if (!row) {
    // Single-page sites: unknown paths without an extension show the home page.
    if (!/\.[a-z0-9]{2,5}$/i.test(path)) return serveFile(request, env, slug, "index.html");
    return page(404, "Not found", "This page does not exist.");
  }
  const body = row.body instanceof ArrayBuffer ? new Uint8Array(row.body) : new Uint8Array(row.body);
  const isHtml = String(row.mime).startsWith("text/html");
  const headers = {
    "Content-Type": row.mime,
    "Cache-Control": isHtml || path === "site-data.json" ? "no-cache" : "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };
  if (isHtml) headers["Content-Security-Policy"] = CSP;
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(body, { status: 200, headers });
}

export async function handleHostingRoute(request, env, url) {
  const path = url.pathname;

  // Subdomain hosting: <slug>.<HOSTING_DOMAIN>
  const domain = String(env.HOSTING_DOMAIN || "").trim().toLowerCase();
  const host = url.hostname.toLowerCase();
  if (domain && host.endsWith("." + domain) && !path.startsWith("/api/")) {
    const slug = host.slice(0, -(domain.length + 1));
    if (slug && !slug.includes(".") && slug !== "www") {
      if (request.method !== "GET" && request.method !== "HEAD") return page(405, "Not allowed", "Only page views are allowed.");
      return serveFile(request, env, slug, decodeURIComponent(path.replace(/^\/+/, "")));
    }
  }

  // Path hosting: /s/<slug>/<file>
  const m = path.match(/^\/s\/([^/]+)(\/.*)?$/);
  if (m) {
    if (request.method !== "GET" && request.method !== "HEAD") return page(405, "Not allowed", "Only page views are allowed.");
    if (!m[2]) return Response.redirect(new URL("/s/" + m[1] + "/" + url.search, url).href, 301);
    let file;
    try { file = decodeURIComponent(m[2].slice(1)); } catch { return page(404, "Not found", "This page does not exist."); }
    return serveFile(request, env, m[1].toLowerCase(), file);
  }

  if (!path.startsWith("/api/hosting/")) return null;
  const origin = request.headers.get("Origin") || "";
  if (!hostingOrigins(env).has(origin)) {
    return new Response(JSON.stringify({ ok: false, error: "Origin not allowed." }), { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (path === "/api/hosting/publish") {
    if (request.method !== "POST") return reply({ ok: false, error: "Use POST." }, 405, origin);
    return handlePublish(request, env, url, origin);
  }
  if (path === "/api/hosting/verify") {
    if (request.method !== "POST") return reply({ ok: false, error: "Use POST." }, 405, origin);
    return handleVerify(request, env, url, origin);
  }
  if (path === "/api/hosting/check") {
    if (request.method !== "GET") return reply({ ok: false, error: "Use GET." }, 405, origin);
    return handleCheck(env, url, origin);
  }
  return reply({ ok: false, error: "Not found" }, 404, origin);
}
