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

const PRIORITIES = new Set(["mandatory", "important", "optional"]);
const ANSWER_TYPES = new Set(["text", "options", "yes_no", "number", "price", "image", "list"]);

const RULES = `You design the setup interview for BotCraft, software that creates an AI salesman chatbot for a physical shop in India.
Customers scan a QR poster in the shop and chat with the bot on their phone. The bot must answer them using only information the owner gave.
Your questions are asked to the SHOP OWNER, one at a time, to collect that information.

Rules:
- Cover what real customers of this kind of shop ask before buying: products and range, pricing and charges, quality and certification, policies (exchange, return, warranty, repair), payment and offers, services, timings and location, trust, and shop-type-specific topics.
- Shop-level questions only. Individual item prices and photos come from item cards the owner uploads, so ask about ranges, rules and policies instead of single items.
- One piece of information per question. Short, simple English that a small shop owner understands. No jargon.
- No duplicates or near-duplicates.
- Never ask for customer personal data, passwords, bank details, or anything illegal or unsafe.
- priority: "mandatory" only for facts the bot cannot work without (about 10%); "important" for facts most customers ask (about 40%); everything else "optional".
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
      options: answerType === "options" || answerType === "yes_no" ? options : [],
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
    prompt: `Shop type: ${shopDescription}\nLocation: ${place}\n\n${useSearch ? "Search the web for" : "Using your knowledge, work out"} what customers of this kind of shop in ${place} commonly ask, worry about and compare before buying. Then list 12-18 topic categories for the owner interview, with how many questions each needs so the total is about 230.`,
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

  // Step 2: write each category's questions in parallel, then top up the
  // categories that came back short.
  const seen = new Set();
  const byCategory = categories.map(() => []);
  const models = new Set();
  for (let round = 0; round < 3; round += 1) {
    const total = byCategory.reduce((n, list) => n + list.length, 0);
    if (total >= MIN_QUESTIONS) break;
    const tasks = categories
      .map((category, i) => ({ category, i, missing: category.question_count - byCategory[i].length }))
      .filter(t => round === 0 || t.missing > 0)
      .map(({ category, i, missing }) => async () => {
        const count = round === 0 ? category.question_count : Math.max(3, missing);
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
        log(`round ${round + 1}: ${category.name} done (${model})`);
        return { i, questions: result?.questions };
      });
    if (!tasks.length) {
      // Every category is full but the total is short: ask for extras everywhere.
      categories.forEach(c => { c.question_count += 3; });
      continue;
    }
    for (const done of await runLimited(tasks, PARALLEL_REQUESTS)) {
      if (done) byCategory[done.i].push(...normalizeQuestions(done.questions, seen).map(q => ({ ...q, category: categories[done.i].name })));
    }
  }
  const questions = byCategory.flat();
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
