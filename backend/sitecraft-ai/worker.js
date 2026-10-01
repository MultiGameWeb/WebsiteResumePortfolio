const MODEL = "gemini-2.5-flash";
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Site-Token, Authorization"
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders }
  });

const bytesToGb = bytes => bytes / (1024 ** 3);
const nowIso = () => new Date().toISOString();
const addDays = (iso, days) => new Date(new Date(iso).getTime() + days * 86400000).toISOString();

const responseSchema = {
  type: "OBJECT",
  properties: {
    businessType: { type: "STRING" },
    templateId: { type: "STRING" },
    summary: { type: "STRING" },
    enabledFeatures: { type: "ARRAY", items: { type: "STRING" } },
    brand: {
      type: "OBJECT",
      properties: {
        businessName: { type: "STRING" },
        tagline: { type: "STRING" }
      },
      required: ["businessName", "tagline"]
    },
    home: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        text: { type: "STRING" }
      },
      required: ["title", "text"]
    }
  },
  required: ["businessType", "templateId", "summary", "enabledFeatures", "brand", "home"]
};

const SYSTEM_PROMPT = [
  "You are SiteCraft AI, an assistant that converts a plain-language business website request into a structured SiteCraft configuration.",
  "Choose a templateId only from the catalog supplied by the caller.",
  "Choose enabledFeatures only from the feature IDs supplied by the caller.",
  "Do not invent template IDs or feature IDs.",
  "Keep business facts grounded in the user's prompt; when a detail is missing, use neutral placeholder wording.",
  "Return concise, website-ready copy.",
  "Output JSON only."
].join(" ");

async function getSite(env, siteId) {
  if (!env.DB) return null;
  return env.DB.prepare(
    "SELECT id, business_name, plan_gb, storage_used_bytes, storage_expires_at, grace_ends_at, status FROM sites WHERE id = ?"
  ).bind(siteId).first();
}

async function storageSummary(env, siteId) {
  const site = await getSite(env, siteId);
  if (!site) return null;
  const planBytes = Number(site.plan_gb || 0) * (1024 ** 3);
  const used = Number(site.storage_used_bytes || 0);
  const remaining = Math.max(0, planBytes - used);
  return {
    planGb: Number(site.plan_gb || 0),
    usedBytes: used,
    usedGb: Number(bytesToGb(used).toFixed(3)),
    remainingBytes: remaining,
    remainingGb: Number(bytesToGb(remaining).toFixed(3)),
    percentUsed: planBytes ? Number(((used / planBytes) * 100).toFixed(1)) : 0,
    storageExpiresAt: site.storage_expires_at,
    graceEndsAt: site.grace_ends_at,
    status: site.status
  };
}

async function saveLead(env, siteId, body) {
  if (!env.DB) throw new Error("D1 database is not configured.");
  const site = await getSite(env, siteId);
  if (!site) return { error: "SITE_NOT_FOUND" };

  const payload = body && typeof body === "object" ? body : {};
  const id = crypto.randomUUID();
  const createdAt = nowIso();
  const status = "New";

  await env.DB.prepare(
    "INSERT INTO leads (id, site_id, created_at, status, lead_type, name, phone, email, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    siteId,
    createdAt,
    status,
    String(payload.leadType || "Website Enquiry"),
    String(payload.name || ""),
    String(payload.phone || ""),
    String(payload.email || ""),
    JSON.stringify(payload)
  ).run();

  return { id, createdAt, status };
}

async function getStorageAsset(env, siteId, assetId) {
  if (!env.DB) return null;
  return env.DB.prepare(
    "SELECT id, site_id, object_key, kind, mime_type, size_bytes FROM assets WHERE id = ? AND site_id = ?"
  ).bind(assetId, siteId).first();
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(//+$/, "") || "/";
    const model = env.GEMINI_MODEL || MODEL;

    if (request.method === "GET" && path === "/api/health") {
      return json({
        ok: true,
        service: "sitecraft-ai",
        model,
        geminiConfigured: Boolean(env.GEMINI_API_KEY),
        databaseConfigured: Boolean(env.DB),
        mediaConfigured: Boolean(env.MEDIA_BUCKET)
      });
    }

    const storageMatch = path.match(/^\/api\/sites\/([^/]+)\/storage$/);
    if (request.method === "GET" && storageMatch) {
      if (!env.DB) return json({ ok: false, error: "D1 database is not configured." }, 503);
      const siteId = decodeURIComponent(storageMatch[1]);
      const storage = await storageSummary(env, siteId);
      if (!storage) return json({ ok: false, error: "Site not found." }, 404);
      return json({ ok: true, siteId, storage });
    }

    const leadMatch = path.match(/^\/api\/sites\/([^/]+)\/leads$/);
    if (request.method === "POST" && leadMatch) {
      if (!env.DB) return json({ ok: false, error: "D1 database is not configured." }, 503);
      const siteId = decodeURIComponent(leadMatch[1]);
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Lead body must be valid JSON." }, 400);
      }
      const raw = JSON.stringify(body || {});
      if (raw.length > 100_000) return json({ ok: false, error: "Lead payload is too large." }, 413);
      try {
        const result = await saveLead(env, siteId, body);
        if (result?.error === "SITE_NOT_FOUND") return json({ ok: false, error: "Site not found." }, 404);
        return json({ ok: true, result }, 201);
      } catch (error) {
        return json({ ok: false, error: "Could not save lead.", detail: String(error?.message || error) }, 500);
      }
    }

    const assetUploadMatch = path.match(/^\/api\/sites\/([^/]+)\/assets$/);
    if (request.method === "POST" && assetUploadMatch) {
      if (!env.DB || !env.MEDIA_BUCKET) return json({ ok: false, error: "Media storage is not configured." }, 503);
      const siteId = decodeURIComponent(assetUploadMatch[1]);
      const site = await getSite(env, siteId);
      if (!site) return json({ ok: false, error: "Site not found." }, 404);

      const siteToken = request.headers.get("X-Site-Token") || "";
      if (!env.SITE_API_TOKEN || siteToken !== env.SITE_API_TOKEN) {
        return json({ ok: false, error: "Unauthorized media upload." }, 401);
      }

      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      const kind = String(url.searchParams.get("kind") || "image").toLowerCase();
      const maxVideoBytes = 50 * 1024 * 1024;
      const contentLength = Number(request.headers.get("Content-Length") || 0);
      if (kind === "video" && contentLength > maxVideoBytes) {
        return json({ ok: false, error: "Video files must be 50 MB or smaller." }, 413);
      }
      if (contentLength <= 0) return json({ ok: false, error: "Content-Length is required for uploads." }, 411);

      const used = Number(site.storage_used_bytes || 0);
      const limit = Number(site.plan_gb || 0) * (1024 ** 3);
      if (used + contentLength > limit) {
        return json({
          ok: false,
          error: "STORAGE_FULL",
          message: "Storage limit reached. Please upgrade your website storage plan."
        }, 413);
      }

      const objectId = crypto.randomUUID();
      const extension = contentType.includes("/") ? contentType.split("/")[1].replace(/[^a-z0-9.+-]/gi, "") : "bin";
      const objectKey = "sites/" + siteId + "/" + kind + "/" + objectId + "." + extension;

      await env.MEDIA_BUCKET.put(objectKey, request.body, {
        httpMetadata: { contentType }
      });

      await env.DB.prepare(
        "INSERT INTO assets (id, site_id, object_key, kind, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(objectId, siteId, objectKey, kind, contentType, contentLength, nowIso()).run();

      await env.DB.prepare(
        "UPDATE sites SET storage_used_bytes = storage_used_bytes + ?, updated_at = ? WHERE id = ?"
      ).bind(contentLength, nowIso(), siteId).run();

      return json({
        ok: true,
        asset: { id: objectId, key: objectKey, kind, sizeBytes: contentLength },
        storage: await storageSummary(env, siteId)
      }, 201);
    }

    const assetDeleteMatch = path.match(/^\/api\/sites\/([^/]+)\/assets\/([^/]+)$/);
    if (request.method === "DELETE" && assetDeleteMatch) {
      if (!env.DB || !env.MEDIA_BUCKET) return json({ ok: false, error: "Media storage is not configured." }, 503);
      const siteId = decodeURIComponent(assetDeleteMatch[1]);
      const assetId = decodeURIComponent(assetDeleteMatch[2]);
      const siteToken = request.headers.get("X-Site-Token") || "";
      if (!env.SITE_API_TOKEN || siteToken !== env.SITE_API_TOKEN) return json({ ok: false, error: "Unauthorized." }, 401);

      const asset = await getStorageAsset(env, siteId, assetId);
      if (!asset) return json({ ok: false, error: "Asset not found." }, 404);

      await env.MEDIA_BUCKET.delete(asset.object_key);
      await env.DB.prepare("DELETE FROM assets WHERE id = ? AND site_id = ?").bind(assetId, siteId).run();
      await env.DB.prepare(
        "UPDATE sites SET storage_used_bytes = MAX(0, storage_used_bytes - ?), updated_at = ? WHERE id = ?"
      ).bind(Number(asset.size_bytes || 0), nowIso(), siteId).run();

      return json({ ok: true, storage: await storageSummary(env, siteId) });
    }

    if (request.method !== "POST" || path !== "/api/ai/generate") {
      return json({ ok: false, error: "Not found" }, 404);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ ok: false, error: "GEMINI_API_KEY is not configured on the Worker." }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Request body must be valid JSON." }, 400);
    }

    const prompt = String(body?.prompt || "").trim();
    const catalog = Array.isArray(body?.catalog) ? body.catalog : [];

    if (!prompt) return json({ ok: false, error: "prompt is required." }, 400);
    if (!catalog.length) return json({ ok: false, error: "template catalog is required." }, 400);

    const catalogText = JSON.stringify(
      catalog.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        features: Array.isArray(item.features) ? item.features : []
      }))
    );

    const userPrompt = ["User website request:", prompt, "", "Available template catalog:", catalogText].join("\n");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema, temperature: 0.4 }
      })
    });

    const rawText = await geminiResponse.text();
    if (!geminiResponse.ok) {
      return json({ ok: false, error: "Gemini API request failed.", detail: rawText.slice(0, 1200) }, geminiResponse.status);
    }

    let geminiJson;
    try { geminiJson = JSON.parse(rawText); }
    catch { return json({ ok: false, error: "Gemini returned an invalid response." }, 502); }

    const outputText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!outputText) return json({ ok: false, error: "Gemini returned no generated content.", finishReason: geminiJson?.candidates?.[0]?.finishReason || null }, 502);

    let generated;
    try { generated = JSON.parse(outputText); }
    catch { return json({ ok: false, error: "Gemini output was not valid JSON." }, 502); }

    const allowedTemplateIds = new Set(catalog.map(x => x.id));
    generated.templateId = allowedTemplateIds.has(generated.templateId) ? generated.templateId : catalog[0].id;
    const featureMap = new Map(catalog.map(x => [x.id, Array.isArray(x.features) ? x.features : []]));
    const allowedFeatures = new Set(featureMap.get(generated.templateId) || []);
    generated.enabledFeatures = Array.isArray(generated.enabledFeatures)
      ? generated.enabledFeatures.filter(x => allowedFeatures.has(x))
      : [];

    return json({ ok: true, model, result: generated });
  }
};
