import {
  BOT_PAGE, DAY_MS, HOSTING_DAYS, bumpCounter, clientIp, ensureSchema, fetchSource, hostingInfo, newEditKey, pickFreeSlug, sha256, siteUrls, slugify
} from "./hosting.js";

// Publishes a BotCraft shop's customer page at its own web address, the same way
// website templates are hosted: https://<slug>.<HOSTING_DOMAIN>/ when that domain
// is set, else https://<worker>/s/<slug>/. Only the home page is stored (in the
// hosting tables); it points the page at the shop's saved data. The page code
// (salesbot/) is served from the SiteCraft source, and the shop's items, photos
// and answers are always read live, so owner updates show right away.
//
// One year of hosting from the first publish, the same term as the templates.

const escHtml = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const jsonForScript = v => JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

// The salesbot home page with the shop's public id built in, and a share preview.
export function buildBotPageHtml(sourceHtml, { publicId, apiBase, shopName, description, siteUrl }) {
  const title = String(shopName || "Shop").slice(0, 120);
  const head = '<script>window.SALESBOT_SHOP=' + jsonForScript(publicId) + ';window.SALESBOT_API_BASE=' + jsonForScript(apiBase) + ';</script>'
    + '<meta property="og:type" content="website"><meta property="og:title" content="' + escHtml(title) + '">'
    + (description ? '<meta property="og:description" content="' + escHtml(description.slice(0, 300)) + '">' : "")
    + (siteUrl ? '<meta property="og:url" content="' + escHtml(siteUrl) + '">' : "");
  return String(sourceHtml)
    // Demo-only helper that lives outside salesbot/.
    .replace(/<script[^>]*chatbot-builder\/demo-api\.js[^>]*><\/script>\s*/i, "")
    .replace(/<title>[\s\S]*?<\/title>/i, "<title>" + escHtml(title) + "</title>")
    .replace(/<head>/i, "<head>" + head);
}

// Creates or refreshes the shop's page. `existingSlug` is the address saved for this shop, if any.
// Returns { ok, slug, url, pathUrl, hosting, created } or { ok: false, status, error }.
export async function publishShopPage(env, request, url, { publicId, shopName, description, existingSlug, requestedSlug }) {
  if (String(env.HOSTING_DISABLED || "") === "true") return { ok: false, status: 503, error: "Publishing is switched off right now. Please try again later." };
  if (String(env.HOSTING_REQUIRE_PAYMENT || "") === "true") return { ok: false, status: 402, error: "Please complete payment before publishing." };
  const db = env.DB;
  if (!db) return { ok: false, status: 503, error: "Hosting storage is not configured." };
  await ensureSchema(db);

  let sourceHtml;
  try { sourceHtml = await fetchSource(env, "salesbot/index.html"); } catch { return { ok: false, status: 502, error: "Could not load the page. Please try again in a minute." }; }
  const apiBase = new URL(url).origin;
  const now = new Date().toISOString();

  let slug = existingSlug || "";
  let created = false;
  let hostingRow = null;
  if (slug) {
    hostingRow = await db.prepare("SELECT slug, status, template_id, created_at, expires_at FROM hosted_sites WHERE slug = ?").bind(slug).first();
    if (!hostingRow || hostingRow.template_id !== BOT_PAGE) { slug = ""; hostingRow = null; }
    else if (hostingRow.status === "blocked") return { ok: false, status: 403, error: "This page has been switched off. Please contact SiteCraft support." };
  }
  if (!slug) {
    const limit = Number(env.HOSTING_DAILY_LIMIT || 10) || 10;
    if (!(await bumpCounter(db, clientIp(request), "create", limit))) return { ok: false, status: 429, error: "Too many new pages from this connection today. Please try again tomorrow." };
    slug = await pickFreeSlug(db, slugify(requestedSlug || shopName || "my-shop"));
    created = true;
  }

  const siteUrl = siteUrls(env, url, slug).url;
  const html = new TextEncoder().encode(buildBotPageHtml(sourceHtml, { publicId, apiBase, shopName, description, siteUrl }));
  const statements = [];
  if (created) {
    const expires = new Date(Date.parse(now) + HOSTING_DAYS * DAY_MS).toISOString();
    // The edit key is not used for shop pages (the owner's shop id is the key); store an unusable hash.
    statements.push(db.prepare(
      "INSERT INTO hosted_sites (slug, template_id, business_name, edit_key_hash, status, size_bytes, created_ip, created_at, updated_at, expires_at) VALUES (?, ?, ?, ?, 'live', ?, ?, ?, ?, ?)"
    ).bind(slug, BOT_PAGE, String(shopName || "").slice(0, 120), await sha256(newEditKey()), html.length, clientIp(request), now, now, expires));
    hostingRow = { created_at: now, expires_at: expires };
  } else {
    statements.push(db.prepare("UPDATE hosted_sites SET business_name = ?, size_bytes = ?, updated_at = ? WHERE slug = ?").bind(String(shopName || "").slice(0, 120), html.length, now, slug));
  }
  statements.push(db.prepare("DELETE FROM hosted_files WHERE slug = ?").bind(slug));
  statements.push(db.prepare("INSERT INTO hosted_files (slug, path, mime, body, size_bytes) VALUES (?, 'index.html', 'text/html; charset=utf-8', ?, ?)").bind(slug, html, html.length));
  try { await db.batch(statements); } catch (error) { return { ok: false, status: 500, error: "Could not publish the page. Please try again." }; }
  const urls = siteUrls(env, url, slug);
  return { ok: true, slug, url: urls.url, pathUrl: urls.pathUrl, created, hosting: hostingInfo(hostingRow) };
}

// The saved page's address and hosting term, for the owner page. null when not published.
export async function shopPageInfo(env, url, slug) {
  if (!slug || !env.DB) return null;
  try {
    await ensureSchema(env.DB);
    const row = await env.DB.prepare("SELECT slug, status, template_id, created_at, expires_at FROM hosted_sites WHERE slug = ?").bind(slug).first();
    if (!row || row.template_id !== BOT_PAGE) return null;
    const urls = siteUrls(env, url, slug);
    return { slug, url: urls.url, pathUrl: urls.pathUrl, status: row.status, hosting: hostingInfo(row) };
  } catch { return null; }
}
