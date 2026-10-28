import { callGemini } from "./ai-engine.js";

// Builds the bank of questions BotCraft asks a shop owner. Gemini researches
// what customers of this kind of shop ask (Google Search grounding), then
// writes one owner-facing question per piece of information the salesman bot
// needs. Banks are stored per shop type and reused for the next owner.

export const BOTCRAFT_KEY_ENV = "BOTCRAFT_GEMINI_API_KEY";
// Tried in order; the next model is used when one is overloaded or out of quota.
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
const PARALLEL_REQUESTS = 4;
const MIN_QUESTIONS = 200;
const MAX_QUESTIONS = 260;
// Generate extra so the bank stays above MIN_QUESTIONS after the review pass.
const TARGET_BEFORE_REVIEW = 245;
const MAX_MANDATORY_EXTRA = 10;

// Asked of every shop, whatever its type; generated questions must not repeat them.
const CORE_QUESTIONS = [
  ["What is your shop's name?", "What is the shop name?", "text", []],
  ["What is your shop's full address, with a nearby landmark?", "Where is your shop?", "text", []],
  ["Please share your shop's Google Maps location link.", "Send me the shop location.", "text", []],
  ["What are your shop's opening and closing times?", "What time do you open?", "text", []],
  ["Which day is your shop closed every week?", "Are you open on Sunday?", "options", ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Open all days"]],
  ["Which phone number should customers call for your shop?", "What is your contact number?", "text", []],
  ["Which WhatsApp number should customers message?", "What is your WhatsApp number?", "options", ["Same as the call number", "A different number"]],
  ["What are the main types of items you sell?", "What do you sell?", "list", []],
  ["Which payment methods do you accept?", "Can I pay by UPI or card?", "list", []]
].map(([owner_question, customer_question, answer_type, options]) => ({
  category: "Shop basics",
  customer_question,
  owner_question,
  priority: "mandatory",
  answer_type,
  options,
  why_customers_ask: "Every customer needs these basics."
}));

const PRIORITIES = new Set(["mandatory", "important", "optional"]);
const ANSWER_TYPES = new Set(["text", "options", "yes_no", "number", "price", "image", "list"]);

const RULES = `You design the setup interview for BotCraft, software that creates an AI salesman chatbot for a physical shop in India.
Customers scan a QR poster in the shop and chat with the bot on their phone. The bot must answer them using only information the owner gave.
Your questions are asked to the SHOP OWNER, one at a time, to collect that information.

Rules:
- Cover what real customers of this kind of shop ask before buying: products and range, pricing and charges, quality and certification, policies (exchange, return, warranty, repair), payment and offers, services, timings and location, trust, and shop-type-specific topics.
- Assume a small or medium local shop run by its owner, not a large showroom chain.
- Ask only about facts of the shop. Never ask about chatbot features, settings or how the bot should behave.
- Do not ask the basics that are always collected separately: shop name, address, Google Maps location, opening times, weekly holiday, call number, WhatsApp number, main items sold and payment methods.
- Never ask the owner to describe or summarise the shop; BotCraft writes the shop summary itself from the items and answers.
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

async function callWithFallback(env, request) {
  let lastError;
  for (const model of MODELS) {
    try {
      return { model, result: await callGemini(env, BOTCRAFT_KEY_ENV, { ...request, model }) };
    } catch (error) {
      request.log?.(`${model} failed: ${error.message.slice(0, 120)}`);
      lastError = error;
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
    duplicate_ids: { type: "ARRAY", items: { type: "INTEGER" }, description: "later questions that ask for the same fact as an earlier one" },
    off_topic_ids: { type: "ARRAY", items: { type: "INTEGER" }, description: "questions about chatbot features, or unsuitable for a small local shop" },
    mandatory_ids: { type: "ARRAY", items: { type: "INTEGER" }, description: `at most ${MAX_MANDATORY_EXTRA} questions the bot truly cannot work without` }
  },
  required: ["duplicate_ids", "off_topic_ids", "mandatory_ids"]
};

// One pass over the whole bank: per-category generation cannot see the
// other categories, so the same fact (e.g. GST) can be asked several times.
async function reviewBank(env, shop, questions, log) {
  const list = questions.map((q, i) => `${i}. [${q.category}] ${q.owner_question}`).join("\n");
  const { result } = await callWithFallback(env, {
    system: RULES,
    prompt: `Shop type: ${shop}\n\nReview this owner interview. The shop basics (name, address, map location, timings, holiday, call and WhatsApp numbers, items sold, payment methods) are already asked separately; treat questions repeating them as duplicates.\n\n${list}\n\nReturn the ids of duplicates (keep the first, list the later ones), off-topic questions, and at most ${MAX_MANDATORY_EXTRA} truly mandatory questions.`,
    schema: REVIEW_SCHEMA,
    temperature: 0.1,
    log
  });
  const ids = key => new Set((result?.[key] || []).filter(Number.isInteger));
  const drop = new Set([...ids("duplicate_ids"), ...ids("off_topic_ids")]);
  const mandatory = new Set([...ids("mandatory_ids")].filter(i => !drop.has(i)).slice(0, MAX_MANDATORY_EXTRA));
  log(`review: dropped ${drop.size}, mandatory ${mandatory.size}`);
  return questions.flatMap((q, i) => drop.has(i) ? [] : [{
    ...q,
    priority: mandatory.has(i) ? "mandatory" : q.priority === "mandatory" ? "important" : q.priority
  }]);
}

function categoryPrompt(shop, place, category, count, existing) {
  return `Shop type: ${shop}\nLocation: ${place}\n\nTopic category: ${category.name}\nWhat customers ask about: ${category.customer_concerns}\n\nWrite ${count} owner interview questions for this category only. Set "category" to "${category.name}".${existing.length ? `\n\nThese questions already exist; do not repeat them:\n${existing.map(q => `- ${q}`).join("\n")}` : ""}`;
}

export async function generateQuestionBank(env, { shopType, city = "", log = () => {} }) {
  const shopDescription = cleanText(shopType, 120);
  if (!shopDescription) throw new Error("shopType is required.");
  const place = cleanText(city, 80) || "India";

  // Step 1: research the topics customers care about. Google Search grounding
  // is not available on the free tier, so it is opt-in.
  const useSearch = env?.BOTCRAFT_SEARCH_GROUNDING === "on";
  const { result: research } = await callWithFallback(env, {
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
  const models = new Set();
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
            system: RULES,
            prompt: categoryPrompt(shopDescription, place, category, count, existing),
            schema: QUESTION_SCHEMA,
            temperature: 0.5,
            maxOutputTokens: 12000,
            log
          });
          models.add(model);
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
    generated = await reviewBank(env, shopDescription, generated, log);
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
    model: [...models].join(", "),
    researched_with_search: useSearch,
    categories,
    questions: ordered
  };
}
