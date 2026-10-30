import { callGemini } from "./ai-engine.js";

// Builds the bank of questions BotCraft asks a shop owner. Gemini researches
// what customers of this kind of shop ask (Google Search grounding), then
// writes one owner-facing question per piece of information the salesman bot
// needs. Banks are stored per shop type and reused for the next owner.

export const BOTCRAFT_KEY_ENV = "BOTCRAFT_GEMINI_API_KEY";
// Tried in order; the next model is used when one is overloaded or out of quota.
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const PARALLEL_REQUESTS = 4;
const MIN_QUESTIONS = 200;
const MAX_QUESTIONS = 260;
// Generate extra so the bank stays above MIN_QUESTIONS after the review pass.
const TARGET_BEFORE_REVIEW = 245;
const MAX_MANDATORY_EXTRA = 10;

// Asked of every shop, whatever its type; generated questions must not repeat them.
// `ask_if` makes a question depend on the answer to another core question.
export const CORE_QUESTIONS = [
  { key: "shop_name", q: "What is your shop's name?", c: "What is the shop name?" },
  { key: "owner_name", q: "What is the owner's name?", c: "Who is the owner?" },
  { key: "owner_photo", q: "Would you like to add a photo of yourself (the owner)?", c: "Who should I ask for at the counter?", type: "image", priority: "optional" },
  { key: "shop_front_photo", q: "Please send a photo of your shop front or signboard.", c: "How do I recognise the shop?", type: "image" },
  { key: "address", q: "What is your shop's full address, with a nearby landmark?", c: "Where is your shop?" },
  { key: "shop_area", q: "Is your shop in a village, town, district headquarters or city?", c: "Is this shop in the city?", type: "options", options: ["Village", "Town / mandal", "District headquarters", "City"] },
  { key: "map_link", q: "Please share your shop's Google Maps location link.", c: "Send me the shop location." },
  { key: "parking", q: "Is parking available for customers?", c: "Is there parking near the shop?", type: "options", options: ["Own parking for cars and bikes", "Valet parking", "Bike parking only", "Street parking nearby", "No parking"] },
  { key: "timings", q: "What are your shop's opening and closing times?", c: "What time do you open?" },
  { key: "weekly_holiday", q: "Which day is your shop closed every week?", c: "Are you open on Sunday?", type: "options", options: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Open all days"] },
  { key: "call_number", q: "Which phone number should customers call for your shop?", c: "What is your contact number?" },
  { key: "whatsapp_number", q: "Which WhatsApp number should customers message?", c: "What is your WhatsApp number?", type: "options", options: ["Same as the call number", "A different number"] },
  { key: "main_items", q: "What are the main types of items you sell?", c: "What do you sell?", type: "list" },
  { key: "return_exchange", not_types: ["packers_movers", "laundry", "ironing_shop", "driving_school", "rto_agent", "driving_school_rto", "courier_parcel", "flex_printing", "printing_press", "printing_flex", "xerox_printing", "meeseva_online", "restaurant", "fast_food", "tiffin_centre", "catering", "salon", "beauty_parlour", "spa", "mobile_repair", "gym", "tuition_centre", "competitive_coaching", "skill_institute", "play_school", "school", "junior_college", "college", "open_distance", "study_abroad", "sports_academy", "arts_academy", "hotel_stay", "photography", "self_drive_rental", "travels", "self_drive_travels", "goods_equipment_rental", "loan_finance", "gold_loan", "finance_gold", "chit_fund", "insurance_investment", "function_hall", "kitchen_rental", "tent_house", "event_decorator", "dj_sound", "tent_decor_dj", "car_service", "bike_service", "car_bike_service", "car_wash_detailing", "heavy_vehicle_service", "clinic", "dental_clinic", "skin_hair_clinic", "physiotherapy", "ayush_clinic", "diagnostic_lab", "tailor_shop", "real_estate", "hostel_pg", "appliance_repair"], only_for: "shops selling products customers take home (not restaurants, food stalls, salons or other services)", q: "What is your return and exchange policy? One or two lines is enough.", c: "Can I exchange this if it doesn't fit?" },
  { key: "home_delivery", not_types: ["packers_movers", "driving_school", "rto_agent", "driving_school_rto", "courier_parcel", "xerox_printing", "meeseva_online", "salon", "beauty_parlour", "spa", "gym", "tuition_centre", "competitive_coaching", "skill_institute", "play_school", "school", "junior_college", "college", "open_distance", "study_abroad", "sports_academy", "arts_academy", "hotel_stay", "photography", "self_drive_rental", "travels", "self_drive_travels", "goods_equipment_rental", "loan_finance", "gold_loan", "finance_gold", "chit_fund", "insurance_investment", "function_hall", "kitchen_rental", "tent_house", "event_decorator", "dj_sound", "tent_decor_dj", "car_service", "bike_service", "car_bike_service", "car_wash_detailing", "heavy_vehicle_service", "clinic", "dental_clinic", "skin_hair_clinic", "physiotherapy", "ayush_clinic", "diagnostic_lab", "tailor_shop", "real_estate", "hostel_pg", "appliance_repair"], q: "Do you offer home delivery?", c: "Can you deliver to my home?", type: "options", options: ["No home delivery", "Yes, within the city", "Yes, anywhere in India"] },
  { key: "emi", types: ["jewellery", "mobile_shop", "mobile_shop_repair", "appliances_showroom", "computer_shop", "furniture"], only_for: "shops selling costly items such as jewellery, mobiles, electronics, appliances, furniture or vehicles", q: "Do you offer EMI (pay in monthly instalments)?", c: "Can I buy this on EMI?", type: "options", options: ["Yes, on all items", "Yes, on some items", "No EMI"] },
  { key: "emi_items", q: "Which items or price ranges can customers buy on EMI?", c: "Is EMI available on this item?", ask_if: { key: "emi", equals: ["Yes, on some items"] } },
  { key: "emi_options", q: "Which EMI options do you offer?", c: "Which cards or finance companies do you accept for EMI?", type: "list", options: ["Credit card EMI", "Debit card EMI", "Bajaj Finserv EMI card", "TVS Credit", "HDB Financial Services", "HDFC consumer loan", "IDFC First Bank", "Home Credit", "No-cost EMI", "Shop's own instalment plan"], ask_if: { key: "emi", equals: ["Yes, on all items", "Yes, on some items"] } },
  { key: "emi_zero_down", q: "Do you have zero down payment schemes (for example pay just ₹1 and take the product home)?", c: "Can I buy with zero down payment?", type: "options", options: ["Yes", "No", "On some products"], ask_if: { key: "emi", equals: ["Yes, on all items", "Yes, on some items"] } },
  { key: "emi_documents", q: "What does a customer need to bring to buy on EMI?", c: "What documents do I need for EMI?", type: "list", options: ["Aadhaar card", "PAN card", "Credit or debit card", "Bank account / cancelled cheque", "Passport-size photo", "Minimum down payment"], ask_if: { key: "emi", equals: ["Yes, on all items", "Yes, on some items"] } },
  // Optional: printed as a Wi-Fi QR code on the poster for customers without mobile data.
  // Never shown to the salesbot or on the public page.
  { key: "shop_wifi", q: "Do you have free Wi-Fi for customers? If you share its name and password, your QR poster gets a Wi-Fi QR code so customers without mobile data can connect and chat with your bot.", c: "Is there Wi-Fi in the shop?", type: "options", options: ["No Wi-Fi for customers", "Yes, I'll share the name and password"], priority: "optional" },
  { key: "wifi_name", q: "What is the Wi-Fi name (network name)?", c: "What is the Wi-Fi name?", priority: "optional", ask_if: { key: "shop_wifi", equals: ["Yes, I'll share the name and password"] } },
  { key: "wifi_password", q: "What is the Wi-Fi password? It is only printed inside the QR code on your poster.", c: "What is the Wi-Fi password?", priority: "optional", ask_if: { key: "shop_wifi", equals: ["Yes, I'll share the name and password"] } },
  { key: "offers", q: "Are there any offers running right now? You can change them anytime with Update.", c: "Any offers today?", type: "options", options: ["No offers right now", "Yes, I'll describe them"] }
].map(item => ({
  key: item.key,
  category: "Shop basics",
  customer_question: item.c,
  owner_question: item.q,
  priority: item.priority || "mandatory",
  answer_type: item.type || "text",
  options: item.options || [],
  why_customers_ask: "Customers of every shop ask this.",
  ask_if: item.ask_if || null,
  // Shop types the question makes sense for; elsewhere it is marked not applicable.
  only_for: item.only_for || null,
  // For known shop type keys: where the question applies (types) or does not (not_types).
  types: item.types || null,
  not_types: item.not_types || null
}));
const CORE_TOPICS = "shop name, owner name and photo, shop front photo, address, shop area (village, town, district headquarters or city), map location, parking, timings, weekly holiday, call and WhatsApp numbers, main items sold, return and exchange policy, home delivery, EMI (which items, EMI options, zero down payment, documents) and current offers";

const PRIORITIES = new Set(["mandatory", "important", "optional"]);
const ANSWER_TYPES = new Set(["text", "options", "yes_no", "number", "price", "image", "list"]);

const RULES = `You design the setup interview for BotCraft, software that creates an AI salesman chatbot for a physical shop in India.
Customers scan a QR poster in the shop and chat with the bot on their phone. The bot must answer them using only information the owner gave.
Your questions are asked to the SHOP OWNER, one at a time, to collect that information.

Rules:
- Cover what real customers of this kind of shop ask before buying: products and range, pricing and charges, quality and certification, policies (exchange, return, warranty, repair), payment and offers, services, timings and location, trust, and shop-type-specific topics.
- Assume a small or medium local shop run by its owner, not a large showroom chain.
- Ask only about facts of the shop. Never ask about chatbot features, settings or how the bot should behave.
- Do not ask the basics that are always collected separately: ${CORE_TOPICS}.
- Never ask the owner to describe or summarise the shop; BotCraft writes the shop summary itself from the items and answers.
- Do not ask which payment methods (cash, UPI, cards) the shop accepts.
- Never ask for individual items, their prices or photos; those come from the item photos and price lists the owner uploads.
- Shop-level questions only. Individual item prices and photos come from item cards the owner uploads, so ask about ranges, rules and policies instead of single items.
- One piece of information per question. Short, simple English that a small shop owner understands. No jargon.
- No duplicates or near-duplicates.
- Never ask for customer personal data, passwords, bank details, or anything illegal or unsafe.
- priority: "mandatory" only for the few facts the bot cannot work without (at most 5 per category); "important" for facts most customers ask (about 40%); everything else "optional".
- answer_type: "yes_no", "options" (give 2-6 options), "number", "price", "list", "image" (owner sends a photo) or "text".
- Use Indian context: rupees, GST, UPI, local units and customs where relevant.`;

const CATEGORY_SCHEMA = {
  type: "OBJECT",
  properties: {
    shop_type_key: { type: "STRING", description: "lowercase snake_case, e.g. jewellery" },
    display_name: { type: "STRING" },
    categories: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          customer_concerns: { type: "STRING", description: "what customers ask about in this topic" },
          question_count: { type: "INTEGER" }
        },
        required: ["name", "customer_concerns", "question_count"]
      }
    }
  },
  required: ["shop_type_key", "display_name", "categories"]
};

const QUESTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          category: { type: "STRING" },
          customer_question: { type: "STRING", description: "how a customer would ask the bot" },
          owner_question: { type: "STRING", description: "what BotCraft asks the owner" },
          priority: { type: "STRING", enum: [...PRIORITIES] },
          answer_type: { type: "STRING", enum: [...ANSWER_TYPES] },
          options: { type: "ARRAY", items: { type: "STRING" } },
          why_customers_ask: { type: "STRING" }
        },
        required: ["category", "customer_question", "owner_question", "priority", "answer_type", "options", "why_customers_ask"]
      }
    }
  },
  required: ["questions"]
};

function cleanText(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function questionKey(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeQuestions(raw, seen) {
  const out = [];
  for (const q of Array.isArray(raw) ? raw : []) {
    const ownerQuestion = cleanText(q?.owner_question, 240);
    const key = questionKey(ownerQuestion);
    if (!ownerQuestion || seen.has(key)) continue;
    seen.add(key);
    const answerType = ANSWER_TYPES.has(q?.answer_type) ? q.answer_type : "text";
    const options = (Array.isArray(q?.options) ? q.options : [])
      .map(o => cleanText(o, 80)).filter(Boolean).slice(0, 6);
    out.push({
      category: cleanText(q?.category, 60) || "General",
      customer_question: cleanText(q?.customer_question, 240),
      owner_question: ownerQuestion,
      priority: PRIORITIES.has(q?.priority) ? q.priority : "optional",
      answer_type: answerType === "options" && options.length < 2 ? "text" : answerType,
      options: answerType === "options" ? options : answerType === "yes_no" ? ["Yes", "No"] : [],
      why_customers_ask: cleanText(q?.why_customers_ask, 240)
    });
  }
  return out;
}

// Models that hit a quota limit are skipped for a while instead of being
// retried on every request (per Worker isolate).
const MODEL_COOLDOWN_MS = 5 * 60 * 1000;
const coolingUntil = new Map();

// `request.models` overrides the default model order.
export async function callWithFallback(env, request) {
  const order = request.models || MODELS;
  const now = Date.now();
  const ready = order.filter(model => (coolingUntil.get(model) || 0) <= now);
  let lastError;
  for (const model of ready.length ? ready : order) {
    try {
      return { model, result: await callGemini(env, BOTCRAFT_KEY_ENV, { ...request, model }) };
    } catch (error) {
      request.log?.(`${model} failed: ${error.message.slice(0, 120)}`);
      lastError = error;
      if (/Gemini HTTP 429/.test(error.message)) coolingUntil.set(model, Date.now() + MODEL_COOLDOWN_MS);
      if (!/Gemini HTTP (429|500|503)|no content|not valid JSON|fetch failed|terminated|timed? ?out|aborted/i.test(error.message)) throw error;
    }
  }
  throw lastError;
}

// Runs tasks with at most `limit` in flight; a failed task yields null.
async function runLimited(tasks, limit) {
  const results = new Array(tasks.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      try { results[index] = await tasks[index](); } catch { results[index] = null; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

const REVIEW_SCHEMA = {
  type: "OBJECT",
  properties: {
    duplicates: {
      type: "ARRAY",
      description: "questions asking for the same fact as an earlier question",
      items: {
        type: "OBJECT",
        properties: { id: { type: "INTEGER" }, same_as: { type: "INTEGER" } },
        required: ["id", "same_as"]
      }
    },
    off_topic_ids: { type: "ARRAY", items: { type: "INTEGER" }, description: "questions about chatbot features, or unsuitable for a small local shop" },
    mandatory_ids: { type: "ARRAY", items: { type: "INTEGER" }, description: `at most ${MAX_MANDATORY_EXTRA} questions the bot truly cannot work without` }
  },
  required: ["duplicates", "off_topic_ids", "mandatory_ids"]
};
// A review that wants to drop more than this share is treated as unreliable.
const MAX_REVIEW_DROP_SHARE = 0.25;

// One pass over the whole bank: per-category generation cannot see the
// other categories, so the same fact (e.g. GST) can be asked several times.
async function reviewBank(env, shop, questions, log, models) {
  const list = questions.map((q, i) => `${i}. [${q.category}] ${q.owner_question}`).join("\n");
  const { result } = await callWithFallback(env, {
    models,
    system: RULES,
    prompt: `Shop type: ${shop}\n\nReview this owner interview. The shop basics (${CORE_TOPICS}) are already asked separately.\n\n${list}\n\nReturn: duplicates, each with the id of the later question and the earlier question it repeats (only exact same-fact repeats); off-topic question ids; and at most ${MAX_MANDATORY_EXTRA} truly mandatory question ids. Most questions are fine and should not be listed.`,
    schema: REVIEW_SCHEMA,
    temperature: 0.1,
    log
  });
  const valid = i => Number.isInteger(i) && i >= 0 && i < questions.length;
  const drop = new Set([
    ...(result?.duplicates || []).filter(d => valid(d?.id) && valid(d?.same_as) && d.id > d.same_as).map(d => d.id),
    ...(result?.off_topic_ids || []).filter(valid)
  ]);
  if (drop.size > questions.length * MAX_REVIEW_DROP_SHARE) {
    log(`review ignored: it wanted to drop ${drop.size} of ${questions.length}`);
    drop.clear();
  }
  const mandatory = new Set((result?.mandatory_ids || []).filter(i => valid(i) && !drop.has(i)).slice(0, MAX_MANDATORY_EXTRA));
  log(`review: dropped ${drop.size}, mandatory ${mandatory.size}`);
  return questions.flatMap((q, i) => drop.has(i) ? [] : [{
    ...q,
    priority: mandatory.has(i) ? "mandatory" : q.priority === "mandatory" ? "important" : q.priority
  }]);
}

function categoryPrompt(shop, place, category, count, existing) {
  return `Shop type: ${shop}\nLocation: ${place}\n\nTopic category: ${category.name}\nWhat customers ask about: ${category.customer_concerns}\n\nWrite ${count} owner interview questions for this category only. Set "category" to "${category.name}".${existing.length ? `\n\nThese questions already exist; do not repeat them:\n${existing.map(q => `- ${q}`).join("\n")}` : ""}`;
}

export async function generateQuestionBank(env, { shopType, city = "", log = () => {}, models }) {
  const shopDescription = cleanText(shopType, 120);
  if (!shopDescription) throw new Error("shopType is required.");
  const place = cleanText(city, 80) || "India";

  // Step 1: research the topics customers care about. Google Search grounding
  // is not available on the free tier, so it is opt-in.
  const useSearch = env?.BOTCRAFT_SEARCH_GROUNDING === "on";
  const { result: research } = await callWithFallback(env, {
    models,
    system: RULES,
    prompt: `Shop type: ${shopDescription}\nLocation: ${place}\n\n${useSearch ? "Search the web for" : "Using your knowledge, work out"} what customers of this kind of shop in ${place} commonly ask, worry about and compare before buying. Then list 12-18 topic categories for the owner interview, with how many questions each needs so the total is about 250.`,
    schema: CATEGORY_SCHEMA,
    tools: useSearch ? [{ google_search: {} }] : undefined,
    log,
    temperature: 0.4
  });

  const categories = (research?.categories || [])
    .map(c => ({
      name: cleanText(c?.name, 60),
      customer_concerns: cleanText(c?.customer_concerns, 400),
      question_count: Math.min(30, Math.max(5, Number(c?.question_count) || 12))
    }))
    .filter(c => c.name);
  if (!categories.length) throw new Error("Research returned no categories.");
  log(`research: ${categories.length} categories`);

  // Step 2: write each category's questions in parallel, topping up the
  // categories that come back short.
  const seen = new Set(CORE_QUESTIONS.map(q => questionKey(q.owner_question)));
  const byCategory = categories.map(() => []);
  const usedModels = new Set();
  async function fill(target) {
    for (let round = 0; round < 3; round += 1) {
      const total = byCategory.reduce((n, list) => n + list.length, 0);
      if (total >= target) return;
      // Spread the shortfall over the categories with the fewest questions.
      const tasks = categories
        .map((category, i) => ({ category, i, missing: category.question_count - byCategory[i].length }))
        .filter(t => t.missing > 0 || (total > 0 && round > 0))
        .map(({ category, i, missing }) => async () => {
          const count = Math.max(3, missing);
          const existing = byCategory[i].map(q => q.owner_question);
          const { model, result } = await callWithFallback(env, {
            models,
            system: RULES,
            prompt: categoryPrompt(shopDescription, place, category, count, existing),
            schema: QUESTION_SCHEMA,
            temperature: 0.5,
            maxOutputTokens: 12000,
            log
          });
          usedModels.add(model);
          log(`${category.name}: +${result?.questions?.length || 0} (${model})`);
          return { i, questions: result?.questions };
        });
      if (!tasks.length) {
        categories.forEach(c => { c.question_count += 3; });
        continue;
      }
      for (const done of await runLimited(tasks, PARALLEL_REQUESTS)) {
        if (done) byCategory[done.i].push(...normalizeQuestions(done.questions, seen).map(q => ({ ...q, category: categories[done.i].name })));
      }
    }
  }

  await fill(TARGET_BEFORE_REVIEW);

  // Step 3: remove duplicates and off-topic questions across categories and
  // choose the few truly mandatory ones. Top up once if the review cut too much.
  let generated = byCategory.flat();
  try {
    generated = await reviewBank(env, shopDescription, generated, log, models);
  } catch (error) {
    log(`review skipped: ${error.message.slice(0, 120)}`);
  }
  if (CORE_QUESTIONS.length + generated.length < MIN_QUESTIONS) {
    categories.forEach((c, i) => { byCategory[i] = generated.filter(q => q.category === c.name); });
    const before = generated.length;
    categories.forEach((c, i) => { c.question_count = byCategory[i].length + 3; });
    await fill(MIN_QUESTIONS - CORE_QUESTIONS.length + 5);
    generated = byCategory.flat();
    log(`top-up after review: ${before} -> ${generated.length}`);
  }
  const questions = [...CORE_QUESTIONS, ...generated];
  if (questions.length < MIN_QUESTIONS) {
    throw new Error(`Only ${questions.length} questions were generated; try again.`);
  }

  const rank = { mandatory: 0, important: 1, optional: 2 };
  const ordered = questions
    .slice(0, MAX_QUESTIONS)
    .sort((a, b) => rank[a.priority] - rank[b.priority])
    .map((q, i) => ({ ...q, sort_order: i }));

  return {
    shop_type_key: cleanText(research.shop_type_key, 60).toLowerCase().replace(/[^a-z0-9_]+/g, "_") || "general",
    display_name: cleanText(research.display_name, 80) || shopDescription,
    model: [...usedModels].join(", "),
    researched_with_search: useSearch,
    categories,
    questions: ordered
  };
}

// Topics already covered by the core questions, or about the bot itself.
// Generation is told to avoid them, but a few slip through.
export const CORE_TOPIC_PATTERN = /\bemi\b|\bparking\b|chatbot|\bthe bot\b|payment method|^(do|does) (you|your shop) (offer|provide) (free )?home delivery\b/i;

// The stored form of a bank: type-specific questions only (core questions live
// in code), with stable ids.
export function toBankRecord(key, name, bank) {
  const questions = bank.questions
    .filter(q => !q.key && !CORE_TOPIC_PATTERN.test(q.owner_question))
    .map((q, i) => ({
      id: `${key}-${String(i + 1).padStart(3, "0")}`,
      category: q.category,
      owner_question: q.owner_question,
      customer_question: q.customer_question,
      priority: q.priority,
      answer_type: q.answer_type,
      ...(q.options?.length ? { options: q.options } : {})
    }));
  return {
    shop_type_key: key,
    name,
    version: 1,
    model: bank.model,
    generated_at: new Date().toISOString().slice(0, 10),
    question_count: questions.length,
    questions
  };
}
