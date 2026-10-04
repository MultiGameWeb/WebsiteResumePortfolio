
import { callGemini, runWorkerFanout, getGeminiKeyStatus } from "./ai-engine.js";
import {
  BASE_PRICE_INR,
  BASE_FEATURE_IDS,
  FEATURE_CATALOG,
  getFeature,
  getEligibleFeatures
} from "./ai-feature-catalog.js";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const BASE_SET = new Set(BASE_FEATURE_IDS);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Site-Token, Authorization"
};

const json = (data, status) => new Response(JSON.stringify(data), {
  status: status || 200,
  headers: { ...JSON_HEADERS, ...corsHeaders }
});

const nowIso = () => new Date().toISOString();
const clean = (value, max) => String(value == null ? "" : value).trim().slice(0, max || 3000);

async function readBody(request) {
  try { return await request.json(); }
  catch { return null; }
}

function compactDetails(details) {
  const out = {};
  if (!details || typeof details !== "object") return out;
  for (const entry of Object.entries(details)) {
    const key = entry[0];
    const value = entry[1];
    if (typeof value === "string") out[key] = value.slice(0, 4000);
    else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

function compactCatalog(items) {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    worker: item.worker,
    priceInr: item.priceInr,
    businessTypes: item.businessTypes,
    requiresBackend: Boolean(item.requiresBackend)
  }));
}

function allowedSuggestions(ids, eligible) {
  const allowed = new Set(eligible.map(item => item.id));
  return Array.from(new Set(Array.isArray(ids) ? ids : [])).filter(id => allowed.has(id)).slice(0, 5);
}

function applySectionPatches(siteHtml, patches) {
  let output = siteHtml;
  for (const patch of Array.isArray(patches) ? patches : []) {
    const sectionId = clean(patch && patch.sectionId, 80).replace(/[^a-zA-Z0-9_-]/g, "");
    const html = clean(patch && patch.html, 150000);
    if (!sectionId || !html) continue;
    const start = "<!-- SITECRAFT:SECTION:" + sectionId + " -->";
    const end = "<!-- /SITECRAFT:SECTION:" + sectionId + " -->";
    const startAt = output.indexOf(start);
    const endAt = output.indexOf(end, startAt + start.length);
    if (startAt >= 0 && endAt > startAt) {
      output = output.slice(0, startAt) + start + "\n" + html + "\n" + end + output.slice(endAt + end.length);
    }
  }
  return output;
}

function injectFeature(siteHtml, featureId, pack) {
  const marker = "<!-- SITECRAFT:FEATURE:" + featureId + " -->";
  if (siteHtml.includes(marker)) return siteHtml;

  const html = clean(pack && pack.html, 160000);
  const css = clean(pack && pack.css, 100000);
  const js = clean(pack && pack.js, 100000);

  const parts = [
    marker,
    html,
    css ? "<style data-sitecraft-feature=\"" + featureId + "\">\n" + css + "\n</style>" : "",
    js ? "<script data-sitecraft-feature=\"" + featureId + "\">\n" + js + "\n</script>" : "",
    "<!-- /SITECRAFT:FEATURE:" + featureId + " -->"
  ].filter(Boolean);

  const block = parts.join("\n");
  const placement = clean(pack && pack.placement, 30).toLowerCase();

  if (placement === "main" && siteHtml.includes("</main>")) {
    return siteHtml.replace("</main>", block + "\n</main>");
  }
  return siteHtml.replace("</body>", block + "\n</body>");
}

function baseShell(name, title, navLabels) {
  const businessName = clean(name || "Your Business", 200) || "Your Business";
  const pageTitle = clean(title || businessName + " — Official Website", 200);
  const links = (Array.isArray(navLabels) ? navLabels : []).filter(x => x && x.id).map(x =>
    "<a href=\"#" + clean(x.id, 80) + "\">" + clean(x.label || x.id, 80) + "</a>"
  ).join("\n");

  return "<!doctype html>\n<html lang=\"en\">\n<head>\n" +
    "<meta charset=\"utf-8\">\n" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n" +
    "<meta name=\"description\" content=\"" + pageTitle.replace(/"/g, "&quot;") + "\">\n" +
    "<title>" + pageTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</title>\n" +
    "<style>" +
    ":root{--sc-bg:#0b1020;--sc-surface:#11182c;--sc-text:#f7f8fc;--sc-muted:#aeb6cc;--sc-accent:#7c5cff;--sc-border:rgba(255,255,255,.12)}" +
    "*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--sc-bg);color:var(--sc-text);font-family:Inter,system-ui,sans-serif}" +
    "a{color:inherit}.sitecraft-nav{position:sticky;top:0;z-index:20;background:rgba(11,16,32,.86);backdrop-filter:blur(16px);border-bottom:1px solid var(--sc-border)}" +
    ".sitecraft-nav-inner{max-width:1180px;margin:auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:20px}" +
    ".sitecraft-brand{font-weight:800;text-decoration:none}.sitecraft-links{display:flex;flex-wrap:wrap;gap:14px;font-size:14px;color:var(--sc-muted)}" +
    ".sitecraft-links a{text-decoration:none}.sitecraft-links a:hover{color:var(--sc-text)}main{width:100%}section[data-sitecraft-section]{width:100%}" +
    "</style>\n</head>\n<body>\n<header class=\"sitecraft-nav\"><div class=\"sitecraft-nav-inner\">" +
    "<a class=\"sitecraft-brand\" href=\"#\">" + businessName + "</a><nav class=\"sitecraft-links\">" + links +
    "</nav></div></header><main>\n";
}

function closeShell() {
  return "</main><footer style=\"max-width:1180px;margin:0 auto;padding:40px 20px;color:var(--sc-muted);font-size:13px\">" +
    "© <span id=\"sitecraft-year\"></span> SiteCraft Website</footer>" +
    "<script>document.getElementById(\"sitecraft-year\").textContent=new Date().getFullYear();</script>" +
    "</body></html>";
}

const ANALYZE_SCHEMA = {
  type: "OBJECT",
  properties: {
    businessType: { type: "STRING" },
    normalizedBusinessType: { type: "STRING" },
    formFields: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          label: { type: "STRING" },
          type: { type: "STRING" },
          required: { type: "BOOLEAN" },
          placeholder: { type: "STRING" },
          help: { type: "STRING" }
        },
        required: ["id", "label", "type", "required", "placeholder", "help"]
      }
    },
    firstMessage: { type: "STRING" }
  },
  required: ["businessType", "normalizedBusinessType", "formFields", "firstMessage"]
};

const PLAN_SCHEMA = {
  type: "OBJECT",
  properties: {
    siteTitle: { type: "STRING" },
    tagline: { type: "STRING" },
    design: {
      type: "OBJECT",
      properties: {
        style: { type: "STRING" },
        tone: { type: "STRING" },
        primaryColor: { type: "STRING" },
        accentColor: { type: "STRING" }
      },
      required: ["style", "tone", "primaryColor", "accentColor"]
    },
    navLabels: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { id: { type: "STRING" }, label: { type: "STRING" } },
        required: ["id", "label"]
      }
    }
  },
  required: ["siteTitle", "tagline", "design", "navLabels"]
};

const SECTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    sections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          title: { type: "STRING" },
          html: { type: "STRING" }
        },
        required: ["id", "title", "html"]
      }
    },
    css: { type: "STRING" },
    js: { type: "STRING" }
  },
  required: ["sections", "css", "js"]
};

const FEATURE_SCHEMA = {
  type: "OBJECT",
  properties: {
    placement: { type: "STRING" },
    html: { type: "STRING" },
    css: { type: "STRING" },
    js: { type: "STRING" },
    notes: { type: "STRING" }
  },
  required: ["placement", "html", "css", "js", "notes"]
};

const QA_SCHEMA = {
  type: "OBJECT",
  properties: {
    approved: { type: "BOOLEAN" },
    issues: { type: "ARRAY", items: { type: "STRING" } },
    patches: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { sectionId: { type: "STRING" }, html: { type: "STRING" } },
        required: ["sectionId", "html"]
      }
    },
    cssAppend: { type: "STRING" },
    jsAppend: { type: "STRING" },
    suggestions: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["approved", "issues", "patches", "cssAppend", "jsAppend", "suggestions"]
};

const ANALYZE_SYSTEM = "You are SiteCraft AI intake planner for the AI-created website path. Never choose or reference a prebuilt template. Identify the business type and create a concise dynamic form for the information needed to build a website. Mandatory base features are home, gallery, enquiry, WhatsApp, call and location. Business/website name is required. Add only useful business-specific fields. Return JSON only and never invent real facts.";

const PLAN_SYSTEM = "You are the SiteCraft AI architect for the AI-created website path. Do not use templates and do not output website code. Build a compact design/site manifest from the customer request and details. Keep the base features home, gallery, enquiry, WhatsApp, call and location. Return JSON only.";

const UI_SYSTEM = "You are SiteCraft Worker 2, UI/Home specialist. Generate only requested UI sections for an AI-created website. Use semantic accessible HTML and responsive CSS. Do not output html/head/body wrappers. Return JSON only.";

const SECTION_SYSTEM = "You are SiteCraft Worker 3, business-sections specialist. Generate only requested business/content sections for an AI-created website. Use semantic responsive HTML. Return JSON only.";

const FUNCTION_SYSTEM = "You are SiteCraft Worker 4, interaction specialist. Generate requested actions/integrations such as WhatsApp, call, location, enquiry and small business interactions. Use supplied customer data only; never invent contact details. Return JSON only.";

const QA_SYSTEM = "You are SiteCraft Worker 5, QA and recommendation specialist for the AI-created website path. Check mandatory features, customer details, navigation targets, WhatsApp/call/location links, forms, accessibility and mobile behavior. Repair clear local issues using section replacements or appended CSS/JS. Also suggest up to five new feature IDs from the eligible catalog. Never repeat installed or previously suggested IDs. Return JSON only.";

async function getJob(env, jobId) {
  if (!env.DB) throw new Error("D1 binding DB is not configured.");
  return env.DB.prepare("SELECT * FROM ai_jobs WHERE id = ?").bind(jobId).first();
}

async function installedIds(env, jobId) {
  const rows = await env.DB.prepare(
    "SELECT feature_id FROM ai_feature_state WHERE job_id = ? AND state = 'installed' ORDER BY added_at ASC"
  ).bind(jobId).all();
  return (rows.results || []).map(row => row.feature_id);
}

async function suggestedIds(env, jobId) {
  const rows = await env.DB.prepare(
    "SELECT feature_id FROM ai_suggestion_history WHERE job_id = ? GROUP BY feature_id ORDER BY MIN(suggested_at) ASC"
  ).bind(jobId).all();
  return (rows.results || []).map(row => row.feature_id);
}

async function currentPrice(env, jobId) {
  const ids = await installedIds(env, jobId);
  return BASE_PRICE_INR + ids.reduce((sum, id) => sum + Number(getFeature(id) ? getFeature(id).priceInr : 0), 0);
}

async function saveFeature(env, jobId, id, priceInr, source) {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO ai_feature_state (job_id, feature_id, state, price_inr, source, added_at) VALUES (?, ?, 'installed', ?, ?, ?)"
  ).bind(jobId, id, Number(priceInr || 0), source || "ai", nowIso()).run();
}

async function saveSuggestions(env, jobId, ids) {
  for (const id of ids) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO ai_suggestion_history (id, job_id, feature_id, suggested_at, decision) VALUES (?, ?, ?, ?, 'shown')"
    ).bind(crypto.randomUUID(), jobId, id, nowIso()).run();
  }
}

async function saveVersion(env, jobId, html, triggerFeatureId) {
  const row = await env.DB.prepare(
    "SELECT COALESCE(MAX(version_no), 0) AS max_version FROM ai_site_versions WHERE job_id = ?"
  ).bind(jobId).first();
  const versionNo = Number(row && row.max_version ? row.max_version : 0) + 1;

  await env.DB.prepare(
    "INSERT INTO ai_site_versions (id, job_id, version_no, trigger_feature_id, html, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), jobId, versionNo, triggerFeatureId || null, html, nowIso()).run();

  return versionNo;
}

async function getSuggestions(env, job) {
  const installed = await installedIds(env, job.id);
  const previouslySuggested = await suggestedIds(env, job.id);

  const eligible = getEligibleFeatures({
    businessType: job.business_type,
    installedIds: installed.concat(BASE_FEATURE_IDS),
    suggestedIds: previouslySuggested
  });

  if (!eligible.length) return [];

  const result = await callGemini(env, 5, {
    system: QA_SYSTEM,
    prompt:
      "Business type: " + job.business_type + "\n" +
      "Installed IDs: " + JSON.stringify(installed) + "\n" +
      "Previously suggested IDs: " + JSON.stringify(previouslySuggested) + "\n" +
      "Eligible catalog:\n" + JSON.stringify(compactCatalog(eligible)) + "\n" +
      "Choose up to five useful new feature IDs. Only use eligible IDs.",
    schema: {
      type: "OBJECT",
      properties: { suggestions: { type: "ARRAY", items: { type: "STRING" } } },
      required: ["suggestions"]
    },
    temperature: 0.2,
    maxOutputTokens: 250
  });

  const valid = allowedSuggestions(result.suggestions, eligible);
  await saveSuggestions(env, job.id, valid);
  return valid.map(id => getFeature(id)).filter(Boolean);
}

async function handlerAnalyze(request, env) {
  const body = await readBody(request);
  const prompt = clean(body && body.prompt, 6000);
  if (!prompt) return json({ ok: false, error: "prompt is required." }, 400);
  if (!env.DB) return json({ ok: false, error: "D1 binding DB is not configured." }, 503);

  const result = await callGemini(env, 1, {
    system: ANALYZE_SYSTEM,
    prompt: prompt,
    schema: ANALYZE_SCHEMA,
    temperature: 0.25,
    maxOutputTokens: 900
  });

  const jobId = crypto.randomUUID();
  const timestamp = nowIso();
  const businessType = clean(result.normalizedBusinessType || result.businessType || "general", 120).toLowerCase();
  const formFields = Array.isArray(result.formFields) ? result.formFields.slice(0, 20) : [];

  await env.DB.prepare(
    "INSERT INTO ai_jobs (id,prompt,business_type,status,form_schema_json,details_json,installed_feature_ids_json,current_price_inr,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
  ).bind(
    jobId,
    prompt,
    businessType,
    "awaiting_details",
    JSON.stringify(formFields),
    "{}",
    JSON.stringify(BASE_FEATURE_IDS),
    BASE_PRICE_INR,
    timestamp,
    timestamp
  ).run();

  return json({
    ok: true,
    path: "ai",
    jobId,
    basePriceInr: BASE_PRICE_INR,
    businessType: result.businessType,
    normalizedBusinessType: businessType,
    baseFeatures: BASE_FEATURE_IDS,
    formFields,
    firstMessage: clean(result.firstMessage, 500)
  }, 201);
}

async function handlerBuildBase(request, env) {
  const body = await readBody(request);
  const jobId = clean(body && body.jobId, 100);
  const details = compactDetails(body && body.details);

  if (!jobId) return json({ ok: false, error: "jobId is required." }, 400);
  const job = await getJob(env, jobId);
  if (!job) return json({ ok: false, error: "AI generation job not found." }, 404);

  await env.DB.prepare("UPDATE ai_jobs SET details_json=?, status='planning', updated_at=? WHERE id=?")
    .bind(JSON.stringify(details), nowIso(), jobId).run();

  const plan = await callGemini(env, 1, {
    system: PLAN_SYSTEM,
    prompt:
      "Original request:\n" + job.prompt + "\n\nBusiness type:\n" + job.business_type +
      "\n\nCustomer details:\n" + JSON.stringify(details) +
      "\n\nCreate the design/site manifest for the base website.",
    schema: PLAN_SCHEMA,
    temperature: 0.35,
    maxOutputTokens: 700
  });

  const workerContext =
    "Business type: " + job.business_type + "\n" +
    "Customer details: " + JSON.stringify(details) + "\n" +
    "Design manifest: " + JSON.stringify(plan) + "\n" +
    "Base features: " + JSON.stringify(BASE_FEATURE_IDS);

  const results = await runWorkerFanout(env, {
    2: {
      system: UI_SYSTEM,
      prompt: workerContext + "\nCreate Home + About/intro only.",
      schema: SECTION_SCHEMA,
      temperature: 0.45,
      maxOutputTokens: 1800
    },
    3: {
      system: SECTION_SYSTEM,
      prompt: workerContext + "\nCreate Gallery + Enquiry only. Use elegant placeholders when image data is not supplied.",
      schema: SECTION_SCHEMA,
      temperature: 0.45,
      maxOutputTokens: 1900
    },
    4: {
      system: FUNCTION_SYSTEM,
      prompt: workerContext + "\nCreate WhatsApp CTA + Call CTA + Location CTA. Make enquiry actionable without inventing data.",
      schema: SECTION_SCHEMA,
      temperature: 0.35,
      maxOutputTokens: 1500
    }
  });

  const sectionResults = [];
  const seen = new Set();
  for (const result of results) {
    for (const section of (result.sections || [])) {
      const id = clean(section && section.id, 80).replace(/[^a-zA-Z0-9_-]/g, "");
      const html = clean(section && section.html, 150000);
      if (!id || !html || seen.has(id)) continue;
      seen.add(id);
      sectionResults.push({ id, html });
    }
  }

  let siteHtml = baseShell(
    details.businessName || details.websiteName || "Your Business",
    plan.siteTitle,
    plan.navLabels
  );

  for (const section of sectionResults) {
    siteHtml +=
      "<!-- SITECRAFT:SECTION:" + section.id + " -->\n" +
      "<section data-sitecraft-section=\"" + section.id + "\">\n" +
      section.html + "\n</section>\n" +
      "<!-- /SITECRAFT:SECTION:" + section.id + " -->\n";
  }

  const globalCss = results.map(x => x.css || "").filter(Boolean).join("\n");
  const globalJs = results.map(x => x.js || "").filter(Boolean).join("\n");
  if (globalCss) siteHtml += "<style data-sitecraft-global>\n" + globalCss + "\n</style>\n";
  if (globalJs) siteHtml += "<script data-sitecraft-global>\n" + globalJs + "\n</script>\n";
  siteHtml += closeShell();

  await env.DB.prepare("UPDATE ai_jobs SET manifest_json=?, status='qa', updated_at=? WHERE id=?")
    .bind(JSON.stringify(plan), nowIso(), jobId).run();

  const qa = await callGemini(env, 5, {
    system: QA_SYSTEM,
    prompt:
      "Business type: " + job.business_type + "\n" +
      "Customer details: " + JSON.stringify(details) + "\n" +
      "Installed base IDs: " + JSON.stringify(BASE_FEATURE_IDS) + "\n" +
      "Website:\n" + siteHtml.slice(0, 240000) +
      "\nRepair clear local issues. Suggest only NEW catalog feature IDs.",
    schema: QA_SCHEMA,
    temperature: 0.2,
    maxOutputTokens: 1800
  });

  siteHtml = applySectionPatches(siteHtml, qa.patches);
  if (clean(qa.cssAppend, 100000)) {
    siteHtml = siteHtml.replace("</body>", "<style data-sitecraft-qa>\n" + qa.cssAppend + "\n</style>\n</body>");
  }
  if (clean(qa.jsAppend, 100000)) {
    siteHtml = siteHtml.replace("</body>", "<script data-sitecraft-qa>\n" + qa.jsAppend + "\n</script>\n</body>");
  }

  for (const id of BASE_FEATURE_IDS) await saveFeature(env, jobId, id, 0, "base");

  await env.DB.prepare(
    "UPDATE ai_jobs SET status='preview', assembled_html=?, installed_feature_ids_json=?, current_price_inr=?, updated_at=? WHERE id=?"
  ).bind(siteHtml, JSON.stringify(BASE_FEATURE_IDS), BASE_PRICE_INR, nowIso(), jobId).run();

  const version = await saveVersion(env, jobId, siteHtml, null);

  const eligible = getEligibleFeatures({
    businessType: job.business_type,
    installedIds: BASE_FEATURE_IDS,
    suggestedIds: await suggestedIds(env, jobId)
  });
  const suggestions = allowedSuggestions(qa.suggestions, eligible);
  await saveSuggestions(env, jobId, suggestions);

  return json({
    ok: true,
    path: "ai",
    jobId,
    status: "preview",
    version,
    currentPriceInr: BASE_PRICE_INR,
    installedFeatures: BASE_FEATURE_IDS,
    previewHtml: siteHtml,
    qa: { approved: Boolean(qa.approved), issues: (qa.issues || []).slice(0, 10) },
    suggestions: suggestions.map(id => getFeature(id)).filter(Boolean)
  });
}

async function handlerAddFeature(request, env) {
  const body = await readBody(request);
  const jobId = clean(body && body.jobId, 100);
  const featureId = clean(body && body.featureId, 100);
  if (!jobId || !featureId) return json({ ok: false, error: "jobId and featureId are required." }, 400);

  const job = await getJob(env, jobId);
  if (!job) return json({ ok: false, error: "AI generation job not found." }, 404);

  const feature = getFeature(featureId);
  if (!feature) return json({ ok: false, error: "Unknown feature." }, 400);
  if (BASE_SET.has(featureId)) return json({ ok: false, error: "Base feature is already included." }, 409);

  const installed = await installedIds(env, jobId);
  if (installed.includes(featureId)) return json({ ok: false, error: "Feature is already installed." }, 409);

  const details = JSON.parse(job.details_json || "{}");
  const keySlot = feature.worker === "ui" ? 2 : feature.worker === "sections" ? 3 : 4;

  const featurePack = await callGemini(env, keySlot, {
    system: keySlot === 2 ? UI_SYSTEM : keySlot === 3 ? SECTION_SYSTEM : FUNCTION_SYSTEM,
    prompt:
      "Add exactly one website feature. Do not regenerate the whole website.\n" +
      "Business type: " + job.business_type + "\n" +
      "Feature ID: " + feature.id + "\n" +
      "Feature name: " + feature.name + "\n" +
      "Feature description: " + feature.description + "\n" +
      "Customer details: " + JSON.stringify(details) + "\n" +
      "Installed feature IDs: " + JSON.stringify(installed) + "\n" +
      "Existing website excerpt: " + clean(job.assembled_html, 180000) +
      "\nReturn only the new feature package.",
    schema: FEATURE_SCHEMA,
    temperature: 0.35,
    maxOutputTokens: 1800
  });

  const updatedHtml = injectFeature(job.assembled_html || "", featureId, featurePack);

  const qa = await callGemini(env, 5, {
    system: QA_SYSTEM,
    prompt:
      "Review an incremental feature update.\nBusiness type: " + job.business_type +
      "\nNew feature: " + feature.id +
      "\nInstalled IDs after update: " + JSON.stringify(installed.concat(featureId)) +
      "\nWebsite after update:\n" + updatedHtml.slice(0, 240000) +
      "\nDo not remove installed features. Suggest only NEW feature IDs.",
    schema: QA_SCHEMA,
    temperature: 0.2,
    maxOutputTokens: 1400
  });

  let finalHtml = applySectionPatches(updatedHtml, qa.patches);
  if (clean(qa.cssAppend, 100000)) {
    finalHtml = finalHtml.replace("</body>", "<style data-sitecraft-qa>\n" + qa.cssAppend + "\n</style>\n</body>");
  }
  if (clean(qa.jsAppend, 100000)) {
    finalHtml = finalHtml.replace("</body>", "<script data-sitecraft-qa>\n" + qa.jsAppend + "\n</script>\n</body>");
  }

  await saveFeature(env, jobId, featureId, feature.priceInr, "ai_suggestion");

  const installedAfter = installed.concat(featureId);
  const newPrice = BASE_PRICE_INR + installedAfter.reduce((sum, id) => sum + Number(getFeature(id) ? getFeature(id).priceInr : 0), 0);

  await env.DB.prepare(
    "UPDATE ai_jobs SET status='preview', assembled_html=?, installed_feature_ids_json=?, current_price_inr=?, updated_at=? WHERE id=?"
  ).bind(finalHtml, JSON.stringify(installedAfter), newPrice, nowIso(), jobId).run();

  const version = await saveVersion(env, jobId, finalHtml, featureId);

  const eligible = getEligibleFeatures({
    businessType: job.business_type,
    installedIds: installedAfter,
    suggestedIds: await suggestedIds(env, jobId)
  });
  const suggestions = allowedSuggestions(qa.suggestions, eligible);
  await saveSuggestions(env, jobId, suggestions);

  return json({
    ok: true,
    path: "ai",
    jobId,
    status: "preview",
    version,
    addedFeature: { id: feature.id, name: feature.name, priceInr: Number(feature.priceInr || 0) },
    currentPriceInr: newPrice,
    installedFeatures: installedAfter,
    previewHtml: finalHtml,
    qa: { approved: Boolean(qa.approved), issues: (qa.issues || []).slice(0, 10) },
    suggestions: suggestions.map(id => getFeature(id)).filter(Boolean)
  });
}

async function handlerSuggestions(request, env) {
  const body = await readBody(request);
  const jobId = clean(body && body.jobId, 100);
  if (!jobId) return json({ ok: false, error: "jobId is required." }, 400);

  const job = await getJob(env, jobId);
  if (!job) return json({ ok: false, error: "AI generation job not found." }, 404);

  return json({
    ok: true,
    jobId,
    currentPriceInr: await currentPrice(env, jobId),
    suggestions: await getSuggestions(env, job)
  });
}

async function handlerStatus(env, jobId) {
  const job = await getJob(env, jobId);
  if (!job) return json({ ok: false, error: "AI generation job not found." }, 404);

  return json({
    ok: true,
    jobId,
    status: job.status,
    businessType: job.business_type,
    basePriceInr: BASE_PRICE_INR,
    currentPriceInr: await currentPrice(env, jobId),
    installedFeatures: await installedIds(env, jobId),
    formFields: JSON.parse(job.form_schema_json || "[]"),
    details: JSON.parse(job.details_json || "{}"),
    previewHtml: job.assembled_html || ""
  });
}

function handlerHealth(env) {
  return json({
    ok: true,
    service: "sitecraft-ai",
    path: "ai-website-generator",
    model: env.GEMINI_MODEL || "gemini-2.5-flash",
    geminiKeys: getGeminiKeyStatus(env),
    databaseConfigured: Boolean(env.DB),
    mediaConfigured: Boolean(env.MEDIA_BUCKET),
    basePriceInr: BASE_PRICE_INR,
    baseFeatures: BASE_FEATURE_IDS,
    featureCount: FEATURE_CATALOG.length
  });
}

export async function handleAiBuilderRoute(request, env, url) {
  const path = url.pathname.replace(/\\/+$/, "") || "/";

  if (request.method === "GET" && path === "/api/ai-builder/health") {
    return handlerHealth(env);
  }

  try {
    if (request.method === "POST" && path === "/api/ai-builder/analyze") {
      return await handlerAnalyze(request, env);
    }
    if (request.method === "POST" && path === "/api/ai-builder/build-base") {
      return await handlerBuildBase(request, env);
    }
    if (request.method === "POST" && path === "/api/ai-builder/add-feature") {
      return await handlerAddFeature(request, env);
    }
    if (request.method === "POST" && path === "/api/ai-builder/suggestions") {
      return await handlerSuggestions(request, env);
    }

    const statusMatch = path.match(/^\/api\/ai-builder\/status\/([^/]+)$/);
    if (request.method === "GET" && statusMatch) {
      return await handlerStatus(env, decodeURIComponent(statusMatch[1]));
    }
  } catch (error) {
    return json({ ok: false, error: String(error && error.message ? error.message : error).slice(0, 1800) }, 500);
  }

  return null;
}
