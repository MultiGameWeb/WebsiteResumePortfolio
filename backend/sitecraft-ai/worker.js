const MODEL = "gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders }
  });

const responseSchema = {
  type: "OBJECT",
  properties: {
    businessType: { type: "STRING" },
    templateId: { type: "STRING" },
    summary: { type: "STRING" },
    enabledFeatures: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
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

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "sitecraft-ai",
        model: env.GEMINI_MODEL || MODEL,
        configured: Boolean(env.GEMINI_API_KEY)
      });
    }

    if (request.method !== "POST" || url.pathname !== "/api/ai/generate") {
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

    if (!prompt) {
      return json({ ok: false, error: "prompt is required." }, 400);
    }

    if (!catalog.length) {
      return json({ ok: false, error: "template catalog is required." }, 400);
    }

    const catalogText = JSON.stringify(
      catalog.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        features: Array.isArray(item.features) ? item.features : []
      }))
    );

    const userPrompt = [
      "User website request:",
      prompt,
      "",
      "Available template catalog:",
      catalogText
    ].join("\n");

    const model = env.GEMINI_MODEL || MODEL;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.4
        }
      })
    });

    const rawText = await geminiResponse.text();

    if (!geminiResponse.ok) {
      return json({
        ok: false,
        error: "Gemini API request failed.",
        detail: rawText.slice(0, 1200)
      }, geminiResponse.status);
    }

    let geminiJson;
    try {
      geminiJson = JSON.parse(rawText);
    } catch {
      return json({ ok: false, error: "Gemini returned an invalid response." }, 502);
    }

    const outputText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!outputText) {
      return json({
        ok: false,
        error: "Gemini returned no generated content.",
        finishReason: geminiJson?.candidates?.[0]?.finishReason || null
      }, 502);
    }

    let generated;
    try {
      generated = JSON.parse(outputText);
    } catch {
      return json({ ok: false, error: "Gemini output was not valid JSON." }, 502);
    }

    const allowedTemplateIds = new Set(catalog.map(x => x.id));
    generated.templateId = allowedTemplateIds.has(generated.templateId)
      ? generated.templateId
      : catalog[0].id;

    const featureMap = new Map(
      catalog.map(x => [x.id, Array.isArray(x.features) ? x.features : []])
    );
    const allowedFeatures = new Set(featureMap.get(generated.templateId) || []);
    generated.enabledFeatures = Array.isArray(generated.enabledFeatures)
      ? generated.enabledFeatures.filter(x => allowedFeatures.has(x))
      : [];

    return json({
      ok: true,
      model,
      result: generated
    });
  }
};
