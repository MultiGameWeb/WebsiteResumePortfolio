const STATIC_BASE = "https://multigameweb.github.io/WebsiteResumePortfolio/";
const MAX_JSON_BYTES = 18 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const PUBLIC_TEMPLATE_IDS = new Set([
  "restaurant-01", "restaurant-02", "photography-01", "photography-02",
  "catering-01", "realestate-01", "interior-01", "realestate-02",
  "salon-01", "salon-02", "bridal-makeup-01", "medical-01", "medical-02",
  "gym-01", "yoga-01", "zumba-01", "crossfit-01", "hiit-01",
  "strength-circuit-01", "mobility-01", "cloudkitchen-01",
  "event-wedding-01", "automotive-01", "coaching-education-01",
  "astrology-01", "ecommerce-01"
]);
const ALLOWED_ORIGINS = new Set([
  "https://multigameweb.github.io",
  "https://websiteresumeportfolio.kammarivinayakumar216.workers.dev",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
]);
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Site-Token",
  "Access-Control-Max-Age": "86400"
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function textResponse(body, status = 200, contentType = "text/plain; charset=utf-8", extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

function isAllowedOrigin(request) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && ALLOWED_ORIGINS.has(origin));
}

function safeSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 38) || "my-website";
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function (ch) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
  });
}

function parseJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

async function readJson(request) {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_JSON_BYTES) {
    throw new Error("REQUEST_TOO_LARGE");
  }
  try { return JSON.parse(raw); } catch { throw new Error("INVALID_JSON"); }
}

async function getSiteBySlug(env, slug) {
  if (!env.DB) return null;
  return env.DB.prepare(
    "SELECT id, slug, template_id, selected_features_json, site_data_json, owner_token_hash, business_name, plan_gb, storage_used_bytes, status, published_at FROM sites WHERE slug = ? LIMIT 1"
  ).bind(slug).first();
}

async function hashToken(token) {
  const bytes = new TextEncoder().encode(String(token || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(function (b) {
    return b.toString(16).padStart(2, "0");
  }).join("");
}

function bearerToken(request) {
  const match = String(request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function authorizeSite(request, site) {
  const token = bearerToken(request);
  if (!token || !site || !site.owner_token_hash) return false;
  return (await hashToken(token)) === site.owner_token_hash;
}

function makePublicData(data) {
  const clone = JSON.parse(JSON.stringify(data || {}));
  function strip(value) {
    if (!value || typeof value !== "object") return;
    if (!Array.isArray(value)) {
      delete value.adminPassword;
      delete value.ownerToken;
      delete value.owner_token;
      delete value.owner_token_hash;
      delete value.leads;
      delete value.enquiries;
      delete value.messages;
      delete value.appointments;
      Object.keys(value).forEach(function (key) { strip(value[key]); });
    } else {
      value.forEach(strip);
    }
  }
  strip(clone);
  return clone;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(function (b) {
    return b.toString(16).padStart(2, "0");
  }).join("");
}

async function sha256(bytes) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}

function parseImageDataUrl(value) {
  const match = String(value).match(/^data:(image\/(?:jpeg|png|webp|gif|avif));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  let binary;
  try { binary = atob(match[2].replace(/\s/g, "")); } catch { throw new Error("INVALID_IMAGE_DATA"); }
  if (binary.length > MAX_IMAGE_BYTES) throw new Error("IMAGE_TOO_LARGE");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { mimeType: match[1].toLowerCase(), bytes: bytes };
}

function extensionFor(mimeType) {
  return ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif"
  })[mimeType] || "bin";
}

async function storeInlineImage(env, siteId, image, requestUrl) {
  if (!env.MEDIA_BUCKET) throw new Error("R2_NOT_CONFIGURED");
  const digest = await sha256(image.bytes);
  const existing = await env.DB.prepare(
    "SELECT id FROM assets WHERE site_id = ? AND content_hash = ? LIMIT 1"
  ).bind(siteId, digest).first();
  if (existing) {
    return new URL("/api/public/assets/" + existing.id, requestUrl).href;
  }

  const site = await env.DB.prepare(
    "SELECT plan_gb, storage_used_bytes, status FROM sites WHERE id = ?"
  ).bind(siteId).first();
  if (!site) throw new Error("SITE_NOT_FOUND");
  const quota = Number(site.plan_gb || 5) * (1024 ** 3);
  const used = Number(site.storage_used_bytes || 0);
  if (used + image.bytes.byteLength > quota) throw new Error("STORAGE_FULL");

  const assetId = crypto.randomUUID();
  const objectKey = "sites/" + siteId + "/image/" + assetId + "." + extensionFor(image.mimeType);
  await env.MEDIA_BUCKET.put(objectKey, image.bytes, {
    httpMetadata: { contentType: image.mimeType, cacheControl: "public, max-age=31536000, immutable" }
  });

  try {
    await env.DB.prepare(
      "INSERT INTO assets (id, site_id, object_key, kind, mime_type, size_bytes, created_at, content_hash) VALUES (?, ?, ?, 'image', ?, ?, ?, ?)"
    ).bind(assetId, siteId, objectKey, image.mimeType, image.bytes.byteLength, new Date().toISOString(), digest).run();
    await env.DB.prepare(
      "UPDATE sites SET storage_used_bytes = storage_used_bytes + ?, updated_at = ? WHERE id = ?"
    ).bind(image.bytes.byteLength, new Date().toISOString(), siteId).run();
  } catch (error) {
    await env.MEDIA_BUCKET.delete(objectKey);
    throw error;
  }
  return new URL("/api/public/assets/" + assetId, requestUrl).href;
}

async function replaceInlineImages(env, siteId, value, requestUrl, memo) {
  if (typeof value === "string") {
    if (!value.startsWith("data:")) return value;
    const image = parseImageDataUrl(value);
    if (!image) throw new Error("UNSUPPORTED_DATA_URL");
    if (memo.has(value)) return memo.get(value);
    const url = await storeInlineImage(env, siteId, image, requestUrl);
    memo.set(value, url);
    return url;
  }
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) out.push(await replaceInlineImages(env, siteId, item, requestUrl, memo));
    return out;
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = await replaceInlineImages(env, siteId, value[key], requestUrl, memo);
    }
    return out;
  }
  return value;
}

async function removeSiteAssets(env, siteId) {
  if (!env.DB) return;
  const rows = await env.DB.prepare(
    "SELECT object_key FROM assets WHERE site_id = ?"
  ).bind(siteId).all();
  if (env.MEDIA_BUCKET) {
    for (const row of rows.results || []) {
      try { await env.MEDIA_BUCKET.delete(row.object_key); } catch {}
    }
  }
  await env.DB.prepare("DELETE FROM assets WHERE site_id = ?").bind(siteId).run();
}

async function cleanupFailedPublish(env, siteId) {
  try { await removeSiteAssets(env, siteId); } catch {}
  try { await env.DB.prepare("DELETE FROM sites WHERE id = ? AND status = 'provisioning'").bind(siteId).run(); } catch {}
}

async function handlePublish(request, env, url) {
  if (env.ENABLE_DEMO_PUBLISH !== "true") {
    return json({
      ok: false,
      error: "DEMO_PUBLISH_DISABLED",
      message: "Demo publishing is disabled. Enable it temporarily in the Cloudflare Worker settings to test hosting."
    }, 403);
  }
  if (!isAllowedOrigin(request)) return json({ ok: false, error: "ORIGIN_NOT_ALLOWED" }, 403);
  if (!env.DB) return json({ ok: false, error: "D1_NOT_CONFIGURED" }, 503);
  if (!env.MEDIA_BUCKET) return json({ ok: false, error: "R2_NOT_CONFIGURED" }, 503);

  let body;
  try { body = await readJson(request); }
  catch (error) {
    return json({ ok: false, error: error.message === "REQUEST_TOO_LARGE" ? "REQUEST_TOO_LARGE" : "INVALID_JSON" }, error.message === "REQUEST_TOO_LARGE" ? 413 : 400);
  }

  const templateId = String(body.templateId || "");
  const data = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : null;
  const selectedFeatures = Array.isArray(body.selectedFeatures)
    ? body.selectedFeatures.filter(function (item) { return typeof item === "string" && item.length <= 80; }).slice(0, 100)
    : [];
  if (!PUBLIC_TEMPLATE_IDS.has(templateId) || !data) {
    return json({ ok: false, error: "INVALID_SITE_CONFIGURATION" }, 400);
  }

  const siteId = crypto.randomUUID();
  const businessName = String(data.brand?.businessName || data.businessName || "My Website").trim().slice(0, 180) || "My Website";
  const slug = safeSlug(businessName) + "-" + crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  const ownerToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const tokenDigest = await hashToken(ownerToken);
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      "INSERT INTO sites (id, owner_id, business_name, plan_gb, storage_used_bytes, storage_expires_at, grace_ends_at, status, created_at, updated_at, slug, template_id, selected_features_json, site_data_json, owner_token_hash) VALUES (?, NULL, ?, 5, 0, NULL, NULL, 'provisioning', ?, ?, ?, ?, ?, '{}', ?)"
    ).bind(siteId, businessName, now, now, slug, templateId, JSON.stringify(selectedFeatures), tokenDigest).run();

    const normalizedData = await replaceInlineImages(env, siteId, data, url.origin, new Map());
    const storedData = JSON.stringify(normalizedData);
    if (new TextEncoder().encode(storedData).byteLength > 1_500_000) {
      throw new Error("SITE_DATA_TOO_LARGE");
    }
    await env.DB.prepare(
      "UPDATE sites SET site_data_json = ?, status = 'active', published_at = ?, updated_at = ? WHERE id = ? AND status = 'provisioning'"
    ).bind(storedData, new Date().toISOString(), new Date().toISOString(), siteId).run();

    const siteUrl = new URL("/s/" + slug, url.origin).href;
    const adminUrl = new URL("/s/" + slug + "/admin", url.origin).href;
    return json({
      ok: true,
      siteId: siteId,
      slug: slug,
      siteUrl: siteUrl,
      adminUrl: adminUrl,
      ownerToken: ownerToken,
      templateId: templateId,
      storedDataInCloud: true
    }, 201);
  } catch (error) {
    await cleanupFailedPublish(env, siteId);
    const message = String(error?.message || error);
    const status = message === "STORAGE_FULL" ? 413
      : message === "SITE_DATA_TOO_LARGE" || message === "IMAGE_TOO_LARGE" || message === "REQUEST_TOO_LARGE" ? 413
      : message === "R2_NOT_CONFIGURED" ? 503
      : message === "UNSUPPORTED_DATA_URL" || message === "INVALID_IMAGE_DATA" ? 400
      : 500;
    const safeMessage = ({
      STORAGE_FULL: "Website storage limit reached.",
      IMAGE_TOO_LARGE: "An uploaded image is larger than the 10 MB limit.",
      SITE_DATA_TOO_LARGE: "Website content is too large to store.",
      R2_NOT_CONFIGURED: "Cloudflare R2 is not configured yet.",
      UNSUPPORTED_DATA_URL: "An uploaded file has an unsupported data format.",
      INVALID_IMAGE_DATA: "An uploaded image could not be decoded."
    })[message] || "Could not publish the website. Check the Worker logs and D1 migration.";
    return json({ ok: false, error: message, message: safeMessage }, status);
  }
}

async function getPublicSite(request, env, slug) {
  if (!env.DB) return json({ ok: false, error: "D1_NOT_CONFIGURED" }, 503);
  const site = await getSiteBySlug(env, slug);
  if (!site || site.status !== "active") return json({ ok: false, error: "SITE_NOT_FOUND" }, 404);
  const data = parseJson(site.site_data_json, {});
  return json({
    ok: true,
    site: {
      slug: site.slug,
      templateId: site.template_id,
      businessName: site.business_name,
      selectedFeatures: parseJson(site.selected_features_json, []),
      data: makePublicData(data),
      publishedAt: site.published_at
    }
  }, 200, { "Cache-Control": "no-store" });
}

async function getSiteContent(request, env, slug) {
  if (!env.DB) return json({ ok: false, error: "D1_NOT_CONFIGURED" }, 503);
  const site = await getSiteBySlug(env, slug);
  if (!site || site.status !== "active") return json({ ok: false, error: "SITE_NOT_FOUND" }, 404);
  if (!(await authorizeSite(request, site))) return json({ ok: false, error: "UNAUTHORIZED" }, 401);
  return json({
    ok: true,
    site: {
      slug: site.slug,
      templateId: site.template_id,
      businessName: site.business_name,
      selectedFeatures: parseJson(site.selected_features_json, []),
      data: parseJson(site.site_data_json, {})
    }
  });
}

async function cleanOrphanAssets(env, siteId, data) {
  const serialized = JSON.stringify(data || {});
  const referenced = new Set(Array.from(serialized.matchAll(/\/api\/public\/assets\/([a-f0-9-]+)/g)).map(function (match) { return match[1]; }));
  const assets = await env.DB.prepare("SELECT id, object_key, size_bytes FROM assets WHERE site_id = ?").bind(siteId).all();
  let removedBytes = 0;
  for (const asset of assets.results || []) {
    if (referenced.has(asset.id)) continue;
    if (env.MEDIA_BUCKET) {
      try { await env.MEDIA_BUCKET.delete(asset.object_key); } catch {}
    }
    await env.DB.prepare("DELETE FROM assets WHERE id = ? AND site_id = ?").bind(asset.id, siteId).run();
    removedBytes += Number(asset.size_bytes || 0);
  }
  if (removedBytes) {
    await env.DB.prepare("UPDATE sites SET storage_used_bytes = MAX(0, storage_used_bytes - ?), updated_at = ? WHERE id = ?")
      .bind(removedBytes, new Date().toISOString(), siteId).run();
  }
}

async function updateSiteContent(request, env, slug, url) {
  if (!env.DB) return json({ ok: false, error: "D1_NOT_CONFIGURED" }, 503);
  if (!env.MEDIA_BUCKET) return json({ ok: false, error: "R2_NOT_CONFIGURED" }, 503);
  const site = await getSiteBySlug(env, slug);
  if (!site || site.status !== "active") return json({ ok: false, error: "SITE_NOT_FOUND" }, 404);
  if (!(await authorizeSite(request, site))) return json({ ok: false, error: "UNAUTHORIZED" }, 401);

  let body;
  try { body = await readJson(request); }
  catch (error) {
    return json({ ok: false, error: error.message === "REQUEST_TOO_LARGE" ? "REQUEST_TOO_LARGE" : "INVALID_JSON" }, error.message === "REQUEST_TOO_LARGE" ? 413 : 400);
  }
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    return json({ ok: false, error: "INVALID_SITE_DATA" }, 400);
  }

  try {
    const normalizedData = await replaceInlineImages(env, site.id, body.data, url.origin, new Map());
    const serialized = JSON.stringify(normalizedData);
    if (new TextEncoder().encode(serialized).byteLength > 1_500_000) {
      return json({ ok: false, error: "SITE_DATA_TOO_LARGE" }, 413);
    }
    const selected = Array.isArray(body.selectedFeatures)
      ? body.selectedFeatures.filter(function (item) { return typeof item === "string" && item.length <= 80; }).slice(0, 100)
      : parseJson(site.selected_features_json, []);
    await env.DB.prepare(
      "UPDATE sites SET business_name = ?, site_data_json = ?, selected_features_json = ?, updated_at = ? WHERE id = ? AND status = 'active'"
    ).bind(
      String(normalizedData.brand?.businessName || normalizedData.businessName || site.business_name).trim().slice(0, 180),
      serialized,
      JSON.stringify(selected),
      new Date().toISOString(),
      site.id
    ).run();
    await cleanOrphanAssets(env, site.id, normalizedData);
    return json({ ok: true, data: normalizedData, selectedFeatures: selected, savedAt: new Date().toISOString() });
  } catch (error) {
    const message = String(error?.message || error);
    const status = message === "STORAGE_FULL" ? 413
      : message === "R2_NOT_CONFIGURED" ? 503
      : message === "IMAGE_TOO_LARGE" ? 413
      : message === "UNSUPPORTED_DATA_URL" || message === "INVALID_IMAGE_DATA" ? 400
      : 500;
    return json({ ok: false, error: message }, status);
  }
}

async function getPublicAsset(env, assetId) {
  if (!env.DB) return textResponse("Storage is not configured.", 503);
  if (!env.MEDIA_BUCKET) return textResponse("R2 is not configured.", 503);
  const asset = await env.DB.prepare(
    "SELECT object_key, mime_type FROM assets WHERE id = ? LIMIT 1"
  ).bind(assetId).first();
  if (!asset) return textResponse("Asset not found.", 404);
  const object = await env.MEDIA_BUCKET.get(asset.object_key);
  if (!object) return textResponse("Asset file not found.", 404);
  const headers = new Headers(CORS_HEADERS);
  headers.set("Content-Type", asset.mime_type || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  return new Response(object.body, { status: 200, headers: headers });
}

async function proxyStaticAsset(request, env, slug, assetPath) {
  const site = await getSiteBySlug(env, slug);
  if (!site || site.status !== "active") return textResponse("Website not found.", 404);
  const templateAsset = assetPath.match(/^templates\/([a-z0-9-]+)\/(template\.json|template\.js|style\.css)$/);
  if (templateAsset && templateAsset[1] !== site.template_id) return textResponse("Not found.", 404);
  const allowed = /^(admin\.css|site-navigation\.css|site-navigation\.js|core\/(store|registry|admin)\.js|templates\.html|templates\/[a-z0-9-]+\/(template\.json|template\.js|style\.css))$/;
  if (!allowed.test(assetPath)) return textResponse("Not found.", 404);
  const upstream = await fetch(STATIC_BASE + assetPath);
  if (!upstream.ok) return textResponse("Website asset unavailable.", 502);
  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Access-Control-Allow-Origin", "*");
  if (assetPath.endsWith(".js")) headers.set("Content-Type", "text/javascript; charset=utf-8");
  if (assetPath.endsWith(".json")) headers.set("Content-Type", "application/json; charset=utf-8");
  if (assetPath.endsWith(".css")) headers.set("Content-Type", "text/css; charset=utf-8");
  return new Response(upstream.body, { status: 200, headers: headers });
}

function publicSiteHtml(slug) {
  const slugJson = JSON.stringify(slug);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><title>Customer Website</title><meta name="referrer" content="strict-origin-when-cross-origin"></head><body style="margin:0"><main id="site"><p style="font-family:Arial,sans-serif;padding:24px">Loading website…</p></main><script type="module">(async function(){const slug=' + slugJson + ';try{const response=await fetch("/api/public/sites/"+encodeURIComponent(slug));const payload=await response.json();if(!response.ok||!payload.site)throw new Error("This website is not available.");const site=payload.site;document.title=site.businessName||"Customer Website";const css=document.createElement("link");css.rel="stylesheet";css.href="/s/"+encodeURIComponent(slug)+"/templates/"+encodeURIComponent(site.templateId)+"/style.css";document.head.appendChild(css);const template=await import("/s/"+encodeURIComponent(slug)+"/templates/"+encodeURIComponent(site.templateId)+"/template.js");const root=document.getElementById("site");let markup=template.render(site.data,site.selectedFeatures);markup=markup.replace(/href=["\\x27]admin\\.html\\?template=[^"\\x27]*["\\x27]/g,"href=\\"/s/"+slug+"/admin\\"");root.innerHTML=markup;if(typeof template.init==="function")template.init(root,site.data,site.selectedFeatures);}catch(error){const root=document.getElementById("site");root.textContent=error&&error.message?error.message:"Unable to load this website.";root.style.cssText="font:16px Arial,sans-serif;padding:28px;color:#333";}})();</script></body></html>';
}

function adminBootstrapScript(slug) {
  return "(async function(){\nconst slug=__SLUG_JSON__;\nconst hash=new URLSearchParams(location.hash.replace(/^#/,\"\"));\nlet token=hash.get(\"token\")||\"\";\nconst app=document.getElementById(\"adminApp\");\nconst screen=document.getElementById(\"authScreen\");\nfunction askToken(message){\n if(app)app.hidden=true;\n if(!screen)return;\n screen.hidden=false;\n screen.innerHTML=\"<div class=\\\"auth-card\\\"><div class=\\\"auth-mark\\\">✦</div><span class=\\\"kicker\\\">SITE ADMIN ACCESS</span><h1>Open your hosted website.</h1><p>\"+message+\"</p><form id=\\\"cloudAdminTokenForm\\\"><label class=\\\"field\\\"><span>Website access token</span><input id=\\\"cloudAdminToken\\\" type=\\\"password\\\" autocomplete=\\\"off\\\" required></label><button class=\\\"dark full\\\" type=\\\"submit\\\">Connect website</button></form></div>\";\n document.getElementById(\"cloudAdminTokenForm\").onsubmit=function(event){event.preventDefault();location.hash=\"token=\"+encodeURIComponent(document.getElementById(\"cloudAdminToken\").value.trim());location.reload();};\n}\nfunction stripDataUrls(value){\n if(typeof value===\"string\")return /^data:image\\//i.test(value)?\"\":value;\n if(Array.isArray(value))return value.map(stripDataUrls);\n if(value&&typeof value===\"object\"){const result={};Object.keys(value).forEach(function(key){result[key]=stripDataUrls(value[key]);});return result;}\n return value;\n}\ntry{\n if(!token){askToken(\"Use the private access link supplied when your website was published.\");return;}\n const response=await fetch(\"/api/sites/\"+encodeURIComponent(slug)+\"/content\",{headers:{Authorization:\"Bearer \"+token}});\n const payload=await response.json();\n if(!response.ok||!payload.site){askToken(\"The access token is missing or invalid. Open the private admin link again.\");return;}\n const site=payload.site;\n const dataKey=\"sitecraft:\"+site.templateId;\n const storagePrefix=\"sitecraft-hosted:\"+slug+\":\";\n const getOriginal=Storage.prototype.getItem;\n const setOriginal=Storage.prototype.setItem;\n const removeOriginal=Storage.prototype.removeItem;\n function mappedKey(key){return String(key).startsWith(\"sitecraft\")?storagePrefix+key:key;}\n function backingStorage(area,key){return area===localStorage&&String(key).startsWith(\"sitecraft\")?sessionStorage:area;}\n let pendingData=null,saveTimer=null,saveChain=Promise.resolve();\n function flushSave(){\n  if(!pendingData)return;\n  const snapshot=pendingData;pendingData=null;saveTimer=null;\n  saveChain=saveChain.catch(function(){}).then(async function(){\n   const saveResponse=await fetch(\"/api/sites/\"+encodeURIComponent(slug)+\"/content\",{method:\"PUT\",headers:{\"Content-Type\":\"application/json\",Authorization:\"Bearer \"+token},body:JSON.stringify({data:snapshot})});\n   const result=await saveResponse.json();\n   if(!saveResponse.ok)throw new Error(result.error||\"Save failed\");\n   if(!pendingData&&!saveTimer){const indicator=document.getElementById(\"saveIndicator\");if(indicator)indicator.textContent=\"All changes synced to Cloudflare\";}\n  }).catch(function(){\n   const indicator=document.getElementById(\"saveIndicator\");if(indicator)indicator.textContent=\"Cloud save failed\";\n  });\n }\n Storage.prototype.getItem=function(key){const area=backingStorage(this,key);return getOriginal.call(area,mappedKey(key));};\n Storage.prototype.removeItem=function(key){const area=backingStorage(this,key);return removeOriginal.call(area,mappedKey(key));};\n Storage.prototype.setItem=function(key,value){\n  const area=backingStorage(this,key);\n  if(key===dataKey){\n   let data;try{data=JSON.parse(value);}catch{return setOriginal.call(area,mappedKey(key),value);}\n   pendingData=data;\n   if(saveTimer)clearTimeout(saveTimer);\n   saveTimer=setTimeout(flushSave,350);\n   return setOriginal.call(area,mappedKey(key),JSON.stringify(stripDataUrls(data)));\n  }\n  if(key===\"sitecraft_builder_state_v2\"){\n   try{const state=JSON.parse(value);if(state&&state.data)state.data=stripDataUrls(state.data);return setOriginal.call(area,mappedKey(key),JSON.stringify(state));}catch{}\n  }\n  return setOriginal.call(area,mappedKey(key),value);\n };\n setOriginal.call(sessionStorage,mappedKey(dataKey),JSON.stringify(site.data));\n if(window.Store)window.Store.update({templateId:site.templateId,data:site.data,selectedFeatures:site.selectedFeatures});\n const script=document.createElement(\"script\");\n script.src=\"core/admin.js\";\n script.onload=function(){const nav=document.createElement(\"script\");nav.src=\"site-navigation.js\";document.body.appendChild(nav);};\n document.body.appendChild(script);\n}catch(error){askToken(\"Could not connect to Cloudflare. Please refresh and try again.\");}\n})();".replace("__SLUG_JSON__", JSON.stringify(slug));
}

async function serveHostedAdmin(request, env, slug) {
  const site = await getSiteBySlug(env, slug);
  if (!site || site.status !== "active") return textResponse("Website not found.", 404);
  const upstream = await fetch(STATIC_BASE + "admin.html");
  if (!upstream.ok) return textResponse("Admin panel template unavailable.", 502);
  let html = await upstream.text();
  const scripts = '<script src="core/admin.js"></script><script src="site-navigation.js"></script>';
  if (!html.includes(scripts)) return textResponse("Admin panel bootstrap could not be prepared.", 502);
  html = html.replace(scripts, "<script>" + adminBootstrapScript(slug) + "</script>");
  html = html.replace(/href="templates\.html"/g, 'href="https://multigameweb.github.io/WebsiteResumePortfolio/templates.html"');
  html = html.replace(/href="index\.html"/g, 'href="/s/' + slug + '"');
  return textResponse(html, 200, "text/html; charset=utf-8", { "Cache-Control": "no-store" });
}

async function serveHostedSite(request, env, slug) {
  const site = await getSiteBySlug(env, slug);
  if (!site || site.status !== "active") return textResponse("Website not found.", 404, "text/html; charset=utf-8");
  return textResponse(publicSiteHtml(slug), 200, "text/html; charset=utf-8", { "Cache-Control": "no-store" });
}

export async function handleHostingRoute(request, env, url) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/api/sites/") || path.startsWith("/api/public/") || path.startsWith("/api/sites")) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (path === "/api/sites/publish" && request.method === "POST") {
    return handlePublish(request, env, url);
  }

  const publicSiteApi = path.match(/^\/api\/public\/sites\/([a-z0-9-]+)$/);
  if (publicSiteApi && request.method === "GET") return getPublicSite(request, env, publicSiteApi[1]);

  const contentApi = path.match(/^\/api\/sites\/([a-z0-9-]+)\/content$/);
  if (contentApi && request.method === "GET") return getSiteContent(request, env, contentApi[1]);
  if (contentApi && request.method === "PUT") return updateSiteContent(request, env, contentApi[1], url);

  const assetApi = path.match(/^\/api\/public\/assets\/([a-f0-9-]+)$/);
  if (assetApi && request.method === "GET") return getPublicAsset(env, assetApi[1]);

  const hostedIndex = path.match(/^\/s\/([a-z0-9-]+)\/index\.html$/);
  if (hostedIndex && request.method === "GET") {
    return Response.redirect(new URL("/s/" + hostedIndex[1], url.origin).href, 302);
  }

  const hostedAdmin = path.match(/^\/s\/([a-z0-9-]+)\/admin$/);
  if (hostedAdmin && request.method === "GET") return serveHostedAdmin(request, env, hostedAdmin[1]);

  const hostedAsset = path.match(/^\/s\/([a-z0-9-]+)\/(.+)$/);
  if (hostedAsset && request.method === "GET") {
    return proxyStaticAsset(request, env, hostedAsset[1], hostedAsset[2]);
  }

  const hostedSite = path.match(/^\/s\/([a-z0-9-]+)$/);
  if (hostedSite && request.method === "GET") return serveHostedSite(request, env, hostedSite[1]);

  return null;
}
