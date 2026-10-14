const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

function response(data, status, origin) {
  const headers = { ...JSON_HEADERS, "Cache-Control": "no-store", "Vary": "Origin" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

async function consumeRateLimit(env, siteId, clientHash, nowMs) {
  const windowStart = Math.floor(nowMs / 60000) * 60000;
  const key = siteId + ":" + clientHash;
  await env.DB.prepare(
    "INSERT INTO website_chatbot_rate_limits (rate_key, site_id, window_start_ms, request_count) VALUES (?, ?, ?, 1) " +
    "ON CONFLICT(rate_key) DO UPDATE SET request_count = CASE " +
    "WHEN window_start_ms = excluded.window_start_ms THEN request_count + 1 ELSE 1 END, " +
    "window_start_ms = excluded.window_start_ms"
  ).bind(key, siteId, windowStart).run();
  const row = await env.DB.prepare(
    "SELECT request_count FROM website_chatbot_rate_limits WHERE rate_key = ?"
  ).bind(key).first();
  return Number(row?.request_count || 0) <= 12;
}

async function reserveDailyMessage(env, siteId, day, limit) {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO website_chatbot_usage (site_id, usage_day, message_count) VALUES (?, ?, 0)"
  ).bind(siteId, day).run();
  await env.DB.prepare(
    "UPDATE website_chatbot_usage SET message_count = message_count + 1 WHERE site_id = ? AND usage_day = ? AND message_count < ?"
  ).bind(siteId, day, limit).run();
  const row = await env.DB.prepare(
    "SELECT message_count FROM website_chatbot_usage WHERE site_id = ? AND usage_day = ?"
  ).bind(siteId, day).first();
  return Number(row?.message_count || 0) <= limit;
}

export async function handleWebsiteChatbotRoute(request, env, url) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/api/website-chatbot/chat") return null;
  if (request.method !== "POST") {
    return response({ ok: false, error: "Method not allowed." }, 405, null);
  }
  if (!env.DB) return response({ ok: false, error: "Database is not configured." }, 503, null);
  if (!env.GEMINI_API_KEY) return response({ ok: false, error: "AI service is not configured." }, 503, null);

  const origin = request.headers.get("Origin") || "";
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 16000) return response({ ok: false, error: "Request is too large." }, 413, null);
    body = JSON.parse(raw);
  } catch {
    return response({ ok: false, error: "Request body must be valid JSON." }, 400, null);
  }

  const siteId = String(body?.siteId || "").trim();
  const message = String(body?.message || "").trim();
  if (!/^[a-zA-Z0-9_-]{2,80}$/.test(siteId)) {
    return response({ ok: false, error: "Invalid site ID." }, 400, null);
  }
  if (!message || message.length > 1000) {
    return response({ ok: false, error: "Message must contain 1–1000 characters." }, 400, null);
  }
  if (!origin) return response({ ok: false, error: "Website origin is required." }, 403, null);

  const site = await env.DB.prepare(
    "SELECT site_id, allowed_origin, business_name, system_instructions, daily_message_limit, enabled " +
    "FROM website_chatbot_sites WHERE site_id = ?"
  ).bind(siteId).first();
  if (!site || Number(site.enabled) !== 1) {
    return response({ ok: false, error: "Website chatbot is not enabled for this site." }, 404, null);
  }
  if (origin !== site.allowed_origin) {
    return response({ ok: false, error: "This website is not authorized to use the chatbot." }, 403, null);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const clientHash = await sha256(siteId + ":" + ip + ":" + (env.CHATBOT_RATE_LIMIT_SALT || "sitecraft-rate-v1"));
  const nowMs = Date.now();
  if (!(await consumeRateLimit(env, siteId, clientHash, nowMs))) {
    return response({ ok: false, error: "Too many messages. Please wait a minute and try again." }, 429, origin);
  }

  const day = new Date().toISOString().slice(0, 10);
  const dailyLimit = Math.max(1, Math.min(10000, Number(site.daily_message_limit || 100)));
  if (!(await reserveDailyMessage(env, siteId, day, dailyLimit))) {
    return response({ ok: false, error: "This website has reached its daily chatbot message limit." }, 429, origin);
  }

  const history = Array.isArray(body?.history) ? body.history.slice(-8).map(item => ({
    role: item?.role === "model" ? "model" : "user",
    parts: [{ text: String(item?.text || "").slice(0, 1000) }]
  })).filter(item => item.parts[0].text) : [];
  const model = env.GEMINI_MODEL || "gemini-3.8-flash";
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) + ":generateContent";

  const systemInstruction = [
    "You are the website assistant for " + String(site.business_name || "this business").slice(0, 120) + ".",
    "Answer questions about this business using only the business information supplied below and the conversation context.",
    "If the information is missing, say you are not sure and suggest contacting the business. Never invent prices, opening hours, availability, policies, addresses, or guarantees.",
    "Be helpful, concise, polite, and respond in the language the visitor uses.",
    "Do not claim to complete bookings, orders, or payments unless an explicitly connected system confirms the action.",
    String(site.system_instructions || "").slice(0, 3000)
  ].filter(Boolean).join("\n");

  const contents = [...history, { role: "user", parts: [{ text: message }] }];
  let geminiResponse;
  try {
    geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    });
  } catch {
    return response({ ok: false, error: "AI service is temporarily unavailable." }, 502, origin);
  }

  if (!geminiResponse.ok) {
    return response({ ok: false, error: "AI service request failed. Please try again later." }, 502, origin);
  }
  let data;
  try { data = await geminiResponse.json(); } catch {
    return response({ ok: false, error: "AI service returned an invalid response." }, 502, origin);
  }
  const answer = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
  if (!answer) return response({ ok: false, error: "No answer was returned. Please try again." }, 502, origin);

  return response({ ok: true, answer, usage: { countedAs: "message", dailyLimit } }, 200, origin);
}
