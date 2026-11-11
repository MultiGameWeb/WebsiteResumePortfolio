// AI video ads for the Photo Video Maker: a short chat collects the business
// details, Gemini writes the video plan (scenes, headlines, image prompts),
// and Gemini's image model draws one picture per scene. The browser then
// renders the video with its own templates (video-maker/maker.js).
//
// POST /api/aivideo/chat  { messages: [{ role: "user" | "assistant", text }] }
//   -> { reply, ready, plan? }
// POST /api/aivideo/image { prompt, format }
//   -> { image: { mimeType, data } }
// POST /api/aivideo/photos { plan, photos: [{ mimeType, data }] }  (the customer's own photos)
//   -> { scenes: [{ photo, headline, line }] }  AI looks at each photo, orders them and writes its text
// POST /api/aivideo/stock { query, format, exclude? }  (free stock photo)
//   -> { image: { mimeType, data }, photo: { id, photographer, url, source } }
//
// Images cost money, so they are limited per address per day and in total per
// day until payments exist. The Gemini key is a Worker secret
// (AIVIDEO_GEMINI_API_KEY, or BotCraft's key when that is not set).
import { allowedOrigins } from "./botcraft-builder.js";
import { callGemini } from "./ai-engine.js";
import { geminiUsProxy } from "./gemini-proxy.js";

// The lite model answers in a couple of seconds; the bigger one is the fallback.
const TEXT_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];
const DEFAULT_IMAGE_MODEL = "gemini-2.5-flash-image";
// The design building blocks of video-maker/styles.js the AI can mix.
const DESIGN = {
  layout: ["playful", "luxe", "bold", "fresh", "clean", "editor", "beat", "parallax", "stack", "slide", "frame", "invite", "sale", "product", "compare", "review", "countdown", "story", "cinema", "kinetic", "event"],
  font: ["round", "serif", "jost", "impact", "sans", "play"],
  motion: ["zoom", "pan", "drift", "punch"],
  transition: ["fade", "flash", "wipe", "slide", "zoom"],
  deco: ["none", "sparkles", "confetti", "bubbles", "petals", "bokeh", "streaks"]
};

function cleanDesign(design) {
  if (!design || typeof design !== "object") return null;
  const hex = value => (/^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toLowerCase() : "");
  const pick = (key) => (DESIGN[key].includes(design[key]) ? design[key] : "");
  const out = { layout: pick("layout"), accent: hex(design.accent), dark: hex(design.dark), font: pick("font"), motion: pick("motion"), transition: pick("transition"), deco: pick("deco") };
  return out.layout ? out : null;
}

const STYLES = ["jewel", "gym", "royal", "offer", "product", "wedding", "birthday", "property", "food"];
const FORMATS = { story: "9:16", square: "1:1", wide: "16:9" };
// Any length from 10 to 60 seconds; about one picture per 6 seconds (2-10).
const MIN_SECONDS = 10;
const MAX_SECONDS = 60;
const sceneCount = seconds => Math.min(10, Math.max(2, Math.ceil(seconds / 6)));
const MAX_MESSAGES = 24;
const MAX_FILES = 6;
const MAX_FILE_CHARS = 4 * 1024 * 1024; // base64 characters, about 3 MB
const FILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"]);
const DEFAULT_IP_DAILY = 12;
const DEFAULT_TOTAL_DAILY = 150;

const keyName = env => (env.AIVIDEO_GEMINI_API_KEY ? "AIVIDEO_GEMINI_API_KEY" : "BOTCRAFT_GEMINI_API_KEY");

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
const clip = (value, max) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

const PLAN_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING", description: "your next chat message to the customer, in their language, short and friendly" },
    ready: { type: "BOOLEAN", description: "true only when you have enough to make the video and the customer agreed" },
    plan: {
      type: "OBJECT",
      description: "the video plan; fill it in whenever ready is true",
      properties: {
        title: { type: "STRING", description: "business or event name, as it should appear" },
        subtitle: { type: "STRING", description: "the main offer or message, under 60 characters" },
        contact: { type: "STRING", description: "phone or WhatsApp number exactly as the customer gave it, or empty" },
        closing: { type: "STRING", description: "a short call to action for the end, under 40 characters" },
        badge: { type: "STRING", description: "a short corner badge for the whole video, 1-3 words, e.g. 'ADMISSIONS OPEN', 'DIWALI SALE', or empty" },
        details: { type: "STRING", description: "for invitations and events: the date, time and venue lines exactly as the customer gave them, separated by ' | ' (e.g. 'Sunday, 12 Dec 2026 | 10:30 AM | Sri Sai Function Hall, Warangal'); else empty" },
        design: {
          type: "OBJECT",
          description: "the look of the video, chosen to suit this business and its customers",
          properties: {
            layout: { type: "STRING", enum: DESIGN.layout },
            accent: { type: "STRING", description: "main colour as #rrggbb, matching the business, brand or occasion" },
            dark: { type: "STRING", description: "a deep background tint as #rrggbb that goes with the accent" },
            font: { type: "STRING", enum: DESIGN.font },
            motion: { type: "STRING", enum: DESIGN.motion },
            transition: { type: "STRING", enum: DESIGN.transition },
            deco: { type: "STRING", enum: DESIGN.deco }
          },
          required: ["layout", "accent", "dark", "font", "motion", "transition", "deco"]
        },
        style: { type: "STRING", enum: STYLES },
        format: { type: "STRING", enum: Object.keys(FORMATS) },
        // Gemini allows "enum" on strings only; an INTEGER enum fails every request.
        seconds: { type: "INTEGER", description: "video length in seconds, any whole number from 10 to 60" },
        scenes: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              eyebrow: { type: "STRING", description: "a small label above the headline, 2-5 words, e.g. 'SMART CLASSES • EXPERT TEACHERS', in the customer's language" },
              headline: { type: "STRING", description: "2-6 words shown big on the scene, in the customer's language" },
              line: { type: "STRING", description: "a short supporting line: a price, benefit or tagline, under 40 characters, or empty" },
              image_prompt: { type: "STRING", description: "an English description of the photo for this scene" },
              stock_query: { type: "STRING", description: "2-4 plain English words to search free stock photos for this scene, e.g. 'indian street food'" }
            },
            required: ["eyebrow", "headline", "line", "image_prompt", "stock_query"]
          }
        }
      },
      required: ["title", "subtitle", "contact", "closing", "style", "format", "seconds", "scenes", "design"]
    }
  },
  required: ["reply", "ready"]
};

const PLAN_RULES = `You are the SiteCraft AI video assistant. You help an Indian small business make a short promotional video ad for WhatsApp Status, Instagram Reels or YouTube by chatting with them.

Collect, asking only for what is missing (two or three things at a time, never a long form):
- business name and type, and what to promote (offer, product, service, event); for an invitation or event, the person's name, the function, and the date, time and venue
- the phone or WhatsApp number to show (optional)
- video length: any number of seconds from 10 to 60 (suggest 30). The price is the same for any length. If they ask for more than 60, explain that the most is 60 seconds (1 minute)
- size: Status / Reels (9:16, the default), post (1:1) or YouTube (16:9)
- the language for the text on the video (default: the language the customer writes in)

The customer may share photos or files (a menu, price list, brochure, visiting card or shop photo). Read them: details written there (name, phone, products, prices, offers) count as given by the customer, so do not ask for them again. If they shared photos, say their photos can be used in the video.

When you have enough, briefly summarise the plan (style, length, scenes) and ask them to confirm. When they confirm, set ready true and fill in the plan. After that the customer picks free online photos, AI pictures or their own photos with buttons, so do not ask for photos in the chat.

Plan rules:
- scenes: one per 6 seconds, rounded up, at least 2 and at most 10 (10 s: 2, 15 s: 3, 20 s: 4, 30 s: 5, 45 s: 8, 60 s: 10). Use exactly the length the customer asked for.
- style: jewel (jewellery, luxury), gym (fitness, sports), royal (weddings, events, wedding services), food (restaurants, sweets, bakeries), property (real estate, hotels, resorts), product (shops, electronics, products), offer (sales and discounts), wedding (other functions), birthday (birthdays, kids).
- eyebrow, headlines and lines in the customer's chosen language; keep them short and punchy. Each scene tells one selling point (for example a school: the campus, classes and teachers, sports, labs, admissions with the phone number).
- design: choose the look that best suits THIS business and its customers, so different businesses get different videos.
  layout: playful (bright and friendly: schools, kids, toys, birthdays, coaching), luxe (elegant: jewellery, weddings, sarees, salons, spas, hotels, perfumes), bold (energetic: gyms, sports, big sales, events, bikes, nightlife), fresh (warm and tasty: restaurants, sweets, bakeries, cafes, grocery, organic), clean (calm and trustworthy: real estate, hospitals, clinics, electronics, finance, offices, services), editor (a before → after makeover shown inside a photo-editing app: photo studios, editing services, salons and makeup, renovation, interiors, car detailing, cleaning), beat (very fast photo cuts with shake, for many photos: fashion, events, parties, travel, youth brands, launches), parallax (photo cards popping out with 3D depth: products, real estate, cafes, showrooms), stack (one photo at a time with frame, shapes, label, title and price sticker stacking on: offers, menus, shops, services), slide (each photo's centre slides in fast with motion blur and lands on its own background: portraits, fashion, salons, coaching, personal brands), frame (photo in a gold frame with rising golden bokeh, hearts and calligraphy: anniversaries, wedding wishes, birthdays, festival greetings), invite (traditional invitation with mango-leaf toran, marigold garlands and a golden mandapam arch: half saree / langa voni, naming ceremony, house warming, engagement, wedding and pooja invitations).
  Ad templates (prefer these for promotions): sale (flash sale with zoom punches, tapes and a price burst: offers, discounts, clearance), product (product on a tilting card with feature callouts: electronics, gadgets, cosmetics, new arrivals), compare (before / after slider: salons, cleaning, repairs, renovation, fitness results), review (customer quotes with stars — ONLY when the customer shares real customer reviews; never invent reviews), countdown (top reasons counting down: why choose us, services list), story (social story look with stickers and a poll: cafes, boutiques, local shops, youth brands), cinema (film look with letterbox and light leaks: jewellery, hotels, resorts, real estate, weddings), kinetic (big words in motion on split screens: services, coaching, launches, announcements), event (spotlights, ribbon, confetti and date chips: grand openings, events, exhibitions, sales days).
  accent: the colour people link with the business, brand or occasion (e.g. hospital teal, organic green, Diwali orange-gold, wedding red-gold, tech blue); dark: a deep tint of it for the background.
  font: round (friendly), serif (luxury), play (classic elegant), jost (modern clean), impact (strong uppercase), sans (simple bold).
  motion: zoom (gentle), pan (calm side move), drift (slow cinematic), punch (fast and strong).
  transition: fade (soft), flash (energetic), wipe (neat), slide (modern), zoom (lively).
  deco: none, sparkles (luxury, festive), confetti (celebration, kids, offers), bubbles (spa, laundry, drinks, kids), petals (weddings, flowers, beauty), bokeh (dreamy, events, night), streaks (speed, gym, tech, cars).
- stock_query: 2-4 simple English words that would find a fitting real photo on a stock photo site (for example "biryani plate", "luxury villa pool", "gold necklace"). Add "indian" when people or places should look Indian.
- image_prompt: a vivid, photorealistic description in English of one scene that fits the business, set in India with Indian people and places where people appear. Describe only the picture: no words, letters, numbers, logos, brand names, watermarks or real or famous people.
- Never invent prices, discounts, awards or guarantees the customer did not give. No medical or financial promises. Do not copy other brands.
- If the request is illegal, hateful, adult, or meant to mislead, politely refuse and offer a normal promotional video instead.
- Reply in the customer's language and script (Telugu, Hindi, English or mixed), in one to three short sentences.`;

function cleanPlan(plan) {
  if (!plan) return null;
  const seconds = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(Number(plan.seconds) || 30)));
  const count = sceneCount(seconds);
  const scenes = (Array.isArray(plan.scenes) ? plan.scenes : []).slice(0, count).map(s => ({
    eyebrow: clip(s?.eyebrow, 40), headline: clip(s?.headline, 50), line: clip(s?.line, 50), imagePrompt: clip(s?.image_prompt, 600),
    stockQuery: clip(s?.stock_query, 60) || clip(s?.image_prompt, 600).split(" ").slice(0, 4).join(" ")
  })).filter(s => s.imagePrompt);
  if (!scenes.length) return null;
  return {
    title: clip(plan.title, 60), subtitle: clip(plan.subtitle, 90), contact: clip(plan.contact, 40), closing: clip(plan.closing, 60), badge: clip(plan.badge, 30), details: clip(plan.details, 200),
    style: STYLES.includes(plan.style) ? plan.style : "offer",
    design: cleanDesign(plan.design),
    format: FORMATS[plan.format] ? plan.format : "story",
    seconds, scenes
  };
}

// Says what went wrong without leaking details, so a setup problem is not
// mistaken for a busy AI.
function friendlyError(error) {
  const text = String(error?.message || "");
  if (/not configured/i.test(text)) return "The AI is not set up yet (Gemini key missing). Please try again later.";
  if (/API key|API_KEY_INVALID|PERMISSION_DENIED|HTTP 40[13]/i.test(text)) return "The AI key is not working right now. Please try again later.";
  if (/HTTP 429|RESOURCE_EXHAUSTED/i.test(text)) return "The AI is busy right now (too many requests). Please try again in a minute.";
  return "The AI is busy right now. Please try again in a moment.";
}

// ---- The customer's own photos ----
// The AI looks at the customer's photos, puts them in the best order for the
// ad and writes each scene's text to match what the photo shows.
const PHOTO_SCHEMA = {
  type: "OBJECT",
  properties: {
    scenes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          photo: { type: "INTEGER", description: "number of the photo, starting at 1" },
          eyebrow: { type: "STRING", description: "a small label above the headline, 2-5 words, in the plan's language" },
          headline: { type: "STRING", description: "1-4 words shown big on this photo, in the plan's language, matching what the photo shows" },
          line: { type: "STRING", description: "a short supporting line (price, benefit or tagline from the plan), under 40 characters, or empty" }
        },
        required: ["photo", "eyebrow", "headline", "line"]
      }
    }
  },
  required: ["scenes"]
};

const PHOTO_RULES = `You direct a short promotional video ad made from the customer's own photos. You get the video plan (business, offer, language, the scene ideas) and the photos, numbered from 1.
- Use every usable photo exactly once, in the order that tells the best story (best eye-catching photo first, the offer or shop in the middle, a closing-style photo last). Leave out only photos that are blurry, broken or unrelated.
- For each photo write a headline that fits what the photo really shows, in the same language as the plan's headlines.
- line: a price, offer or benefit from the plan when it matches the photo, else empty. Never invent prices, discounts or claims.
- Never mention people's names or identify people in the photos.`;

async function photoScenes(env, body) {
  const plan = body?.plan || {};
  const photos = (Array.isArray(body?.photos) ? body.photos : []).slice(0, 10)
    .filter(p => ["image/jpeg", "image/png", "image/webp"].includes(p?.mimeType) && typeof p?.data === "string" && p.data.length <= MAX_FILE_CHARS && /^[A-Za-z0-9+/=]+$/.test(p.data));
  if (!photos.length) return { status: 400, data: { ok: false, error: "Please add at least one photo." } };
  const brief = JSON.stringify({
    title: clip(plan.title, 60), subtitle: clip(plan.subtitle, 90), closing: clip(plan.closing, 60), style: clip(plan.style, 20),
    scenes: (Array.isArray(plan.scenes) ? plan.scenes : []).slice(0, 10).map(s => ({ eyebrow: clip(s?.eyebrow, 40), headline: clip(s?.headline, 50), line: clip(s?.line, 50) }))
  });
  const parts = [{ text: `Video plan: ${brief}\n\n${photos.length} photos follow, numbered 1 to ${photos.length}.` }];
  photos.forEach((p, i) => parts.push({ text: `Photo ${i + 1}:` }, { inlineData: { mimeType: p.mimeType, data: p.data } }));
  let lastError;
  for (const model of TEXT_MODELS) {
    try {
      const result = await callGemini(env, keyName(env), { model, system: PHOTO_RULES, contents: [{ role: "user", parts }], schema: PHOTO_SCHEMA, temperature: 0.4, timeoutMs: 45000, maxAttempts: 2 });
      const seen = new Set();
      const scenes = (Array.isArray(result?.scenes) ? result.scenes : [])
        .map(s => ({ photo: Math.round(Number(s?.photo)) - 1, eyebrow: clip(s?.eyebrow, 40), headline: clip(s?.headline, 50), line: clip(s?.line, 50) }))
        .filter(s => s.photo >= 0 && s.photo < photos.length && !seen.has(s.photo) && seen.add(s.photo));
      if (!scenes.length) throw new Error("No scenes for the photos.");
      return { status: 200, data: { ok: true, scenes } };
    } catch (error) {
      lastError = error;
    }
  }
  console.error("AI video photo scenes failed", lastError);
  return { status: 503, data: { ok: false, error: friendlyError(lastError) } };
}

async function chat(env, body) {
  const raw = (Array.isArray(body?.messages) ? body.messages : []).slice(-MAX_MESSAGES);
  // Files the customer shared (photos, a menu or brochure PDF, a text file)
  // go to the AI as they are; only the newest few are kept to save cost.
  let fileBudget = MAX_FILES;
  const messages = raw.slice().reverse().map(m => {
    const role = m?.role === "assistant" ? "model" : "user";
    const parts = [];
    const text = clip(m?.text, 1500);
    if (text) parts.push({ text });
    if (role === "user" && Array.isArray(m?.files)) {
      for (const file of m.files.slice(0, MAX_FILES)) {
        const mimeType = String(file?.mimeType || "");
        const data = String(file?.data || "");
        if (!fileBudget || !FILE_TYPES.has(mimeType) || !data || data.length > MAX_FILE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(data)) continue;
        parts.push({ inlineData: { mimeType, data } });
        fileBudget -= 1;
      }
    }
    return { role, parts };
  }).reverse().filter(m => m.parts.length);
  // Gemini wants the conversation to start with the customer.
  while (messages.length && messages[0].role === "model") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return { status: 400, data: { ok: false, error: "Please type a message." } };
  let lastError;
  for (const model of TEXT_MODELS) {
    try {
      const result = await callGemini(env, keyName(env), { model, system: PLAN_RULES, contents: messages, schema: PLAN_SCHEMA, temperature: 0.5, timeoutMs: 45000, maxAttempts: 2 });
      const plan = result?.ready ? cleanPlan(result.plan) : null;
      return { status: 200, data: { ok: true, reply: clip(result?.reply, 1200) || "Please tell me a little more about your business.", ready: Boolean(plan), plan } };
    } catch (error) {
      lastError = error;
    }
  }
  console.error("AI video chat failed", lastError);
  return { status: 503, data: { ok: false, error: friendlyError(lastError) } };
}

// ---- Daily image limits (D1) ----

async function useImageQuota(env, ip) {
  const db = env.BOTCRAFT_DB;
  if (!db) return { ok: true };
  const day = new Date().toISOString().slice(0, 10);
  await db.prepare("CREATE TABLE IF NOT EXISTS aivideo_usage (day TEXT NOT NULL, who TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, who))").run();
  const ipLimit = Number(env.AIVIDEO_IP_DAILY) || DEFAULT_IP_DAILY;
  const totalLimit = Number(env.AIVIDEO_DAILY_LIMIT) || DEFAULT_TOTAL_DAILY;
  const [mine, all] = await Promise.all([
    db.prepare("SELECT n FROM aivideo_usage WHERE day = ? AND who = ?").bind(day, `ip:${ip}`).first(),
    db.prepare("SELECT n FROM aivideo_usage WHERE day = ? AND who = 'all'").bind(day).first()
  ]);
  if ((all?.n || 0) >= totalLimit) return { ok: false, error: "Today's free AI images are used up. Please try again tomorrow, or use your own photos below." };
  if ((mine?.n || 0) >= ipLimit) return { ok: false, error: "You have used today's free AI images. Please try again tomorrow, or use your own photos below." };
  const add = "INSERT INTO aivideo_usage (day, who, n) VALUES (?, ?, 1) ON CONFLICT(day, who) DO UPDATE SET n = n + 1";
  await db.batch([db.prepare(add).bind(day, `ip:${ip}`), db.prepare(add).bind(day, "all")]);
  return { ok: true };
}

// A picture that failed costs nothing, so its count is given back.
async function refundImageQuota(env, ip) {
  const db = env.BOTCRAFT_DB;
  if (!db) return;
  const day = new Date().toISOString().slice(0, 10);
  const back = "UPDATE aivideo_usage SET n = MAX(0, n - 1) WHERE day = ? AND who = ?";
  await db.batch([db.prepare(back).bind(day, `ip:${ip}`), db.prepare(back).bind(day, "all")]).catch(() => {});
}

async function image(env, body, ip) {
  const prompt = clip(body?.prompt, 600);
  if (!prompt) return { status: 400, data: { ok: false, error: "Missing image description." } };
  const quota = await useImageQuota(env, ip);
  if (!quota.ok) return { status: 429, data: { ok: false, error: quota.error } };
  let result;
  try {
    result = await drawImage(env, body, prompt);
  } catch (error) {
    console.error("AI video image error", error);
    result = { status: 502, data: { ok: false, error: "This picture could not be made. Please try again." } };
  }
  if (result.status !== 200) await refundImageQuota(env, ip);
  return result;
}

async function drawImage(env, body, prompt) {
  const aspectRatio = FORMATS[body?.format] || "9:16";
  const apiKey = env[keyName(env)];
  if (!apiKey) return { status: 503, data: { ok: false, error: "AI images are not set up yet." } };
  const model = env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${prompt}\n\nPhotorealistic, cinematic advertising photo, rich light, sharp focus. No text, letters, numbers, logos or watermarks anywhere in the image.` }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio } }
    })
  };
  let response = await fetch(endpoint, { ...init, signal: AbortSignal.timeout(60000) });
  // A short burst limit clears in a moment: wait and try once more.
  if (response.status === 429) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    response = await fetch(endpoint, { ...init, signal: AbortSignal.timeout(60000) });
  }
  if (response.status === 400) {
    const detail = await response.clone().text();
    const proxy = geminiUsProxy(env);
    if (proxy && /location is not supported/i.test(detail)) response = await proxy.fetch(endpoint, init);
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 600);
    console.error("AI video image failed", response.status, detail);
    // The code helps the owner tell a wrong model name (404) or a key without
    // image access or billing (400/403, or 429 with a zero free-tier quota)
    // from a busy AI (429).
    const noQuota = response.status === 429 && /limit: ?0\b|free_tier|billing/i.test(detail);
    const why = noQuota
      ? "AI pictures are not switched on for this AI key yet (image quota or billing). You can use your own photos instead."
      : response.status === 429 ? "The AI is busy right now. Please try again in a minute." : "This picture could not be made. Please try again.";
    return { status: 502, data: { ok: false, error: `${why} (code ${response.status})` } };
  }
  const payload = await response.json();
  const part = (payload?.candidates?.[0]?.content?.parts || []).find(p => p?.inlineData?.data);
  if (!part) return { status: 502, data: { ok: false, error: "The AI did not return a picture for this scene. Please try again." } };
  return { status: 200, data: { ok: true, image: { mimeType: part.inlineData.mimeType || "image/png", data: part.inlineData.data } } };
}

// ---- Free stock photos ----
// Free photos with no watermark, from the first source that is set up:
// Pixabay (PIXABAY_API_KEY), Pexels (PEXELS_API_KEY), else Openverse, which
// needs no key (only CC0 / public-domain photos, free for business use).
// The Worker fetches the photo itself so the browser canvas can record it
// (a picture loaded from another site would block recording).
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

const STOCK_SOURCES = [
  {
    name: "Pixabay",
    ready: env => Boolean(env.PIXABAY_API_KEY),
    async search(env, query, format) {
      const orientation = { story: "vertical", square: "all", wide: "horizontal" }[format];
      const api = `https://pixabay.com/api/?key=${encodeURIComponent(env.PIXABAY_API_KEY)}&q=${encodeURIComponent(query)}&image_type=photo&orientation=${orientation}&safesearch=true&per_page=20`;
      const response = await fetch(api, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Pixabay HTTP ${response.status}`);
      return ((await response.json())?.hits || []).map(h => ({ id: `pb${h.id}`, src: h.largeImageURL || h.webformatURL, photographer: h.user, url: h.pageURL }));
    }
  },
  {
    name: "Pexels",
    ready: env => Boolean(env.PEXELS_API_KEY),
    async search(env, query, format) {
      const orientation = { story: "portrait", square: "square", wide: "landscape" }[format];
      const api = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=15`;
      const response = await fetch(api, { headers: { Authorization: env.PEXELS_API_KEY }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Pexels HTTP ${response.status}`);
      return ((await response.json())?.photos || []).map(p => ({
        id: `px${p.id}`, photographer: p.photographer, url: p.url,
        src: format === "story" ? p.src?.portrait : format === "wide" ? p.src?.landscape : p.src?.large
      }));
    }
  },
  {
    name: "Openverse",
    ready: () => true,
    async search(env, query, format) {
      const aspect = { story: "tall", square: "square", wide: "wide" }[format];
      const api = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=cc0,pdm&aspect_ratio=${aspect}&size=medium,large&mature=false&page_size=20`;
      const response = await fetch(api, { headers: { "User-Agent": "SiteCraftVideoMaker/1.0" }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Openverse HTTP ${response.status}`);
      return ((await response.json())?.results || []).map(r => ({ id: `ov${r.id}`, src: r.url, photographer: r.creator, url: r.foreign_landing_url }));
    }
  }
];

async function stock(env, body) {
  const query = clip(body?.query, 60);
  if (!query) return { status: 400, data: { ok: false, error: "Missing photo search." } };
  const format = FORMATS[body?.format] ? body.format : "story";
  const skip = new Set((Array.isArray(body?.exclude) ? body.exclude : []).slice(0, 20).map(String));
  const queries = [query];
  // A very specific search can come back empty: try its first two words too.
  if (query.split(" ").length > 2) queries.push(query.split(" ").slice(0, 2).join(" "));
  for (const source of STOCK_SOURCES.filter(s => s.ready(env))) {
    for (const q of queries) {
      try {
        const photos = (await source.search(env, q, format)).filter(p => p.src && !skip.has(p.id));
        // Try a few of the top results: a source photo can be missing or huge.
        const picks = photos.slice(0, 6).sort(() => Math.random() - 0.5).slice(0, 3);
        for (const photo of picks) {
          const file = await fetch(photo.src, { headers: { "User-Agent": "SiteCraftVideoMaker/1.0" }, signal: AbortSignal.timeout(20000) }).catch(() => null);
          const type = file?.headers.get("Content-Type") || "";
          if (!file?.ok || !type.startsWith("image/") || Number(file.headers.get("Content-Length") || 0) > MAX_PHOTO_BYTES) continue;
          const bytes = new Uint8Array(await file.arrayBuffer());
          if (bytes.length > MAX_PHOTO_BYTES) continue;
          let binary = "";
          for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return {
            status: 200,
            data: {
              ok: true,
              image: { mimeType: type.split(";")[0], data: btoa(binary) },
              photo: { id: photo.id, photographer: clip(photo.photographer, 60), url: photo.url || "", source: source.name }
            }
          };
        }
      } catch (error) {
        console.error("AI video stock photo failed", source.name, error);
      }
    }
  }
  return { status: 404, data: { ok: false, error: "No free photo found for this scene. Try 🔄 again, AI pictures or your own photos." } };
}

// Short-term limit on chat messages per address (per isolate).
const recent = new Map();
function throttled(ip, now, limit) {
  const list = (recent.get(ip) || []).filter(t => now - t < 60000);
  list.push(now);
  recent.set(ip, list);
  return list.length > limit;
}

export async function handleAiVideoRoute(request, env, url) {
  const path = url.pathname.replace(/\/+$/, "");
  if (!["/api/aivideo/chat", "/api/aivideo/image", "/api/aivideo/stock", "/api/aivideo/photos"].includes(path)) return null;
  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigins(env).has(origin)) return reply({ ok: false, error: "Origin not allowed." }, 403, origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  if (request.method !== "POST") return reply({ ok: false, error: "Use POST." }, 405, origin);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (throttled(ip, Date.now(), path.endsWith("image") ? 12 : path.endsWith("stock") ? 30 : 20)) return reply({ ok: false, error: "Too many requests. Please wait a minute." }, 429, origin);
  let body;
  try { body = await request.json(); } catch { return reply({ ok: false, error: "Request body must be JSON." }, 400, origin); }
  const result = path.endsWith("chat") ? await chat(env, body)
    : path.endsWith("stock") ? await stock(env, body)
    : path.endsWith("photos") ? await photoScenes(env, body)
    : await image(env, body, ip);
  return reply(result.data, result.status, origin);
}
