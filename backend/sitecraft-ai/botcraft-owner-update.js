// Owner Update mode: the owner writes (or speaks, or sends a photo) "Gold chain
// price 52000" and BotCraft works out WHAT to change. Nothing is changed here:
// the plan is shown to the owner, who confirms it on the owner page.
//
// This file holds the pure parts (schema, prompt, validation) so they can be
// tested without a database or an AI key.

export const INFO_FIELDS = {
  shop_name: 80, timings: 120, weekly_holiday: 60, address: 200, call_number: 20, whatsapp_number: 20, map_link: 300, about: 400
};
const OP_TYPES = ["set_price", "set_stock", "set_details", "add_item", "delete_item", "rename_item", "delete_photo", "set_visibility", "set_section", "edit_answer", "delete_answer", "set_answer_visibility", "add_note", "set_info", "rename_bot", "attach_photo", "record_sale", "set_quantity", "add_quantity"];
const PHOTO_KINDS = ["product", "main", "owner", "gallery"];
const MAX_OPS = 12;
export const SECTIONS = ["about", "gallery", "map"];

export const PLAN_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING", description: "one short sentence in the owner's language saying what you understood" },
    ops: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: OP_TYPES },
          name: { type: "STRING", description: "item name (for item operations)" },
          price: { type: "STRING", description: "price text with the rupee sign, e.g. ₹52,000" },
          details: { type: "STRING", description: "item details text" },
          out_of_stock: { type: "BOOLEAN", description: "true when the item is finished, false when it is back" },
          section: { type: "STRING", enum: SECTIONS, description: "customer page section (set_section)" },
          answer_id: { type: "STRING", description: "id of a saved answer from the list, exactly as written (edit_answer, delete_answer, set_answer_visibility)" },
          new_name: { type: "STRING", description: "the item's new name (rename_item)" },
          photo_index: { type: "INTEGER", description: "1-based number of the photo to delete (delete_photo: a gallery photo, or one of an item's photos; the first is the cover)" },
          hidden: { type: "BOOLEAN", description: "true to hide the item from customers, false to show it again (set_visibility)" },
          field: { type: "STRING", enum: Object.keys(INFO_FIELDS), description: "which shop information to change (set_info)" },
          value: { type: "STRING", description: "the new value (set_info, rename_bot)" },
          photo_kind: { type: "STRING", enum: PHOTO_KINDS, description: "where a sent photo goes (attach_photo)" },
          image: { type: "INTEGER", description: "0-based number of the photo the owner sent (attach_photo)" },
          quantity: { type: "INTEGER", description: "how many were sold (record_sale), 1 when not said" },
          payment: { type: "STRING", enum: ["cash", "upi", "card", "other"], description: "how the customer paid (record_sale), only when the owner said" }
        },
        required: ["type"]
      }
    },
    unclear: { type: "STRING", description: "a short question for the owner when something cannot be understood, else empty" }
  },
  required: ["summary", "ops"]
};

const clip = (value, max) => String(value ?? "").trim().slice(0, max);
export const itemKey = name => String(name || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 140);

// The saved answers are most of this prompt's size, so only the ones related to what the owner wrote are sent (at
// most MAX_PLAN_ANSWERS); with nothing related, a few are sent so "edit the first answer" style asks still work.
// Every item is always listed (name and price only), so item changes never miss.
export const MAX_PLAN_ANSWERS = 25;
const FEW_ANSWERS = 8;
const planTokens = text => String(text || "").toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").split(/\s+/).filter(token => token.length > 2);
export function relevantAnswers(savedAnswers, text) {
  const all = (savedAnswers || []).slice(0, 200);
  if (all.length <= MAX_PLAN_ANSWERS) return all;
  const wanted = new Set(planTokens(text));
  const scored = all.map((answer, index) => ({ answer, index, score: planTokens(`${answer.question} ${answer.answer}`).filter(token => wanted.has(token)).length }));
  const related = scored.filter(entry => entry.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, MAX_PLAN_ANSWERS);
  const chosen = related.length ? related : scored.slice(0, FEW_ANSWERS);
  return chosen.sort((a, b) => a.index - b.index).map(entry => entry.answer);
}

export function buildPlanPrompt(products, info, imageCount, savedAnswers = [], text = "") {
  const answerLines = relevantAnswers(savedAnswers, text).map(a => `- [${a.id}] ${a.question} → ${String(a.answer).slice(0, 160)}${a.hidden ? " (HIDDEN from customers)" : ""}`).join("\n") || "- (no saved answers)";
  const items = (products || []).slice(0, 200).map(p => `- ${p.name}${p.price_text ? ` | ${p.price_text}` : ""}${p.stock_status === "out_of_stock" ? " | out of stock" : p.stock_status === "hidden" ? " | HIDDEN from customers" : ""}`).join("\n") || "- (no items yet)";
  const known = Object.entries(info || {}).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- (nothing saved yet)";
  return [
    "You help a shop owner update their shop assistant. The owner writes or speaks (English, Telugu, Hindi or mixed) and may send photos.",
    "Turn the message into a short list of changes. Do NOT chat. Never invent prices, names or details the owner did not say.",
    "Operations:",
    "- set_price: change an existing item's price (name, price).",
    "- set_stock: mark an existing item finished (out_of_stock true) or back in stock (false).",
    "- set_details: change an existing item's details text.",
    "- add_item: a NEW item (name, price, details). Use it only when the owner clearly adds something new.",
    "- set_visibility: hide an existing item from customers without deleting it (hidden true), or show a hidden item again (hidden false). Use it when the owner says hide / don't show / show again.",
    "- rename_item: change an existing item's name (name = its current name, new_name).",
    "- delete_photo: remove a photo without deleting the item. photo_kind: product (name = the item), main (shop front), owner, or gallery (photo_index = its number, counting from 1). An item can have up to 5 photos; say which one with photo_index. Use it only when the owner clearly says delete/remove the photo.",
    "- edit_answer: change what the assistant tells customers for one saved answer (answer_id from the list below, value = the new answer text).",
    "- delete_answer: remove one saved answer (answer_id). Only when the owner clearly says delete/remove.",
    "- set_answer_visibility: hide a saved answer from customers without deleting it (hidden true), or show it again (hidden false).",
    "- add_note: new information the assistant should tell customers that matches no existing answer, for example a new offer or policy (value = one clear sentence). If an existing saved answer covers it, use edit_answer instead.",
    "- set_section: hide or show a whole section of the customer web page without deleting anything. section is about, gallery (photos) or map (directions link); hidden true to hide, false to show again.",
    "- delete_item: remove an existing item, only when the owner clearly says delete/remove.",
    "- set_info: change shop information. field is one of: shop_name, timings, weekly_holiday, address, call_number, whatsapp_number, map_link, about.",
    "- rename_bot: the assistant's name (value).",
    "- set_quantity: the owner says how many pieces of an existing item are in stock now (name, quantity = the total, 0 when none are left). Use it for 'iPhone 15 stock 10', 'ఫ్యాన్ స్టాక్ 5', 'only 2 TVs left'.",
    "- add_quantity: new stock of an existing item arrived (name, quantity = how many arrived). Use it for 'received 5 iPhone 15', '10 more fans came'.",
    "- record_sale: the owner SOLD an existing item today (name, quantity = how many, 1 if not said; price = the selling price of ONE piece only if the owner said it; payment cash/upi/card only if said). Use it for 'sold 2 iPhone 15', 'ఒక ఫ్యాన్ అమ్మాను', 'sale 1 TV 24000 upi'. It does not change the item's price or stock.",
    `- attach_photo: a photo the owner sent (image = 0-based number, ${imageCount} sent). photo_kind: product (name = the item it shows), main (shop front), owner (the owner), gallery.`,
    "Use the EXACT item name from the list below when the owner means an existing item. Prices keep the rupee sign and Indian digit grouping (₹52,000).",
    "If the owner's message is unclear or an item is not in the list, add a short question in `unclear` and leave that change out.",
    "Write `summary` in the owner's language.",
    "",
    "Current items:", items,
    "",
    `Saved answers (what the assistant tells customers${(savedAnswers || []).length > MAX_PLAN_ANSWERS ? "; the ones most related to this message, there are more" : ""}):`, answerLines,
    "",
    "Current shop information:", known
  ].join("\n");
}

function findProduct(products, name) {
  const key = itemKey(name);
  if (!key) return null;
  const list = products || [];
  return list.find(p => p.name_key === key)
    || list.find(p => itemKey(p.name) === key)
    || list.find(p => p.name_key.includes(key) || key.includes(p.name_key)) || null;
}

const digits = value => String(value ?? "").replace(/\D/g, "").slice(0, 13);
const safeUrl = value => { const v = clip(value, 300); return /^https?:\/\/[^\s]+$/i.test(v) ? v : ""; };

// Keeps only operations that make sense; the owner confirms them anyway.
export function cleanPlan(raw, products, imageCount = 0, savedAnswers = []) {
  const answerById = new Map((savedAnswers || []).map(a => [a.id, a]));
  const ops = [];
  const dropped = [];
  for (const op of (Array.isArray(raw?.ops) ? raw.ops : []).slice(0, MAX_OPS)) {
    const type = String(op?.type || "");
    if (!OP_TYPES.includes(type)) continue;
    if (type === "add_item") {
      const name = clip(op.name, 120);
      if (!name) continue;
      ops.push({ type, name, price: clip(op.price, 80), details: clip(op.details, 600) });
    } else if (type === "set_price" || type === "set_stock" || type === "set_details" || type === "delete_item" || type === "set_visibility") {
      const product = findProduct(products, op.name);
      if (!product) { dropped.push(clip(op.name, 120)); continue; }
      if (type === "set_price") {
        const price = clip(op.price, 80);
        if (!price) continue;
        ops.push({ type, name: product.name, key: product.name_key, price });
      } else if (type === "set_stock") ops.push({ type, name: product.name, key: product.name_key, out_of_stock: op.out_of_stock !== false });
      else if (type === "set_visibility") ops.push({ type, name: product.name, key: product.name_key, hidden: op.hidden !== false });
      else if (type === "set_details") ops.push({ type, name: product.name, key: product.name_key, details: clip(op.details, 600) });
      else ops.push({ type, name: product.name, key: product.name_key });
    } else if (type === "set_section") {
      const section = String(op.section || "");
      if (SECTIONS.includes(section)) ops.push({ type, section, hidden: op.hidden !== false });
    } else if (type === "edit_answer" || type === "delete_answer" || type === "set_answer_visibility") {
      const answer = answerById.get(String(op.answer_id || ""));
      if (!answer) { dropped.push(clip(op.answer_id || op.name, 120)); continue; }
      const base = { type, answer_id: answer.id, question: clip(answer.question, 160) };
      if (type === "edit_answer") {
        const value = clip(op.value, 600);
        if (value) ops.push({ ...base, value });
      } else if (type === "set_answer_visibility") ops.push({ ...base, hidden: op.hidden !== false });
      else ops.push(base);
    } else if (type === "add_note") {
      const value = clip(op.value, 300);
      if (value) ops.push({ type, value });
    } else if (type === "rename_item") {
      const product = findProduct(products, op.name);
      const newName = clip(op.new_name, 120);
      if (!product) { dropped.push(clip(op.name, 120)); continue; }
      if (!newName || newName.toLowerCase().replace(/\s+/g, " ") === product.name_key) continue;
      ops.push({ type, name: product.name, key: product.name_key, new_name: newName });
    } else if (type === "delete_photo") {
      const kind = PHOTO_KINDS.includes(op.photo_kind) ? op.photo_kind : "";
      if (!kind) continue;
      if (kind === "product") {
        const product = findProduct(products, op.name);
        if (!product) { dropped.push(clip(op.name, 120)); continue; }
        const number = Number(op.photo_index);
        ops.push({ type, kind, name: product.name, key: product.name_key, ...(Number.isInteger(number) && number >= 1 ? { index: number } : {}) });
      } else if (kind === "gallery") {
        const index = Number(op.photo_index);
        if (Number.isInteger(index) && index >= 1) ops.push({ type, kind, index });
      } else ops.push({ type, kind });
    } else if (type === "set_quantity" || type === "add_quantity") {
      const product = findProduct(products, op.name);
      if (!product) { dropped.push(clip(op.name, 120)); continue; }
      const quantity = Math.round(Number(op.quantity));
      if (!Number.isInteger(quantity) || quantity < (type === "add_quantity" ? 1 : 0) || quantity > 999999) continue;
      ops.push({ type, name: product.name, key: product.name_key, quantity });
    } else if (type === "record_sale") {
      const product = findProduct(products, op.name);
      if (!product) { dropped.push(clip(op.name, 120)); continue; }
      const quantity = Math.round(Number(op.quantity));
      const unit = digits(op.price).slice(0, 9);
      ops.push({ type, name: product.name, key: product.name_key, quantity: Number.isInteger(quantity) && quantity >= 1 ? Math.min(quantity, 9999) : 1, ...(unit ? { price: unit } : {}), ...(["cash", "upi", "card", "other"].includes(op.payment) ? { payment: op.payment } : {}) });
    } else if (type === "set_info") {
      const field = String(op.field || "");
      if (!(field in INFO_FIELDS)) continue;
      let value = clip(op.value, INFO_FIELDS[field]);
      if (field === "call_number" || field === "whatsapp_number") value = digits(value);
      if (field === "map_link") value = safeUrl(value);
      if (!value) continue;
      ops.push({ type, field, value });
    } else if (type === "rename_bot") {
      const value = clip(op.value, 40);
      if (value) ops.push({ type, value });
    } else if (type === "attach_photo") {
      const image = Number(op.image);
      const kind = PHOTO_KINDS.includes(op.photo_kind) ? op.photo_kind : "";
      if (!Number.isInteger(image) || image < 0 || image >= imageCount || !kind) continue;
      if (kind === "product") {
        const product = findProduct(products, op.name);
        if (product) ops.push({ type, kind, image, name: product.name, key: product.name_key });
        else ops.push({ type, kind, image, name: clip(op.name, 120), key: "", forNewItem: true });
      } else ops.push({ type, kind, image });
    }
  }
  const unclear = clip(raw?.unclear, 300) || (dropped.length ? `I could not find ${dropped.map(n => `“${n}”`).join(", ")} in your items or saved answers. Please check the name.` : "");
  return { summary: clip(raw?.summary, 300), ops, unclear };
}

// ---- "About us" text written from what the owner already told BotCraft ----

export const ABOUT_SCHEMA = {
  type: "OBJECT",
  properties: { about: { type: "STRING", description: "2 or 3 short, friendly sentences about the shop for its web page" } },
  required: ["about"]
};

export function buildAboutPrompt(facts, products) {
  const known = Object.entries(facts || {})
    .filter(([key, value]) => value && ["shop_name", "shop_type", "address", "timings", "weekly_holiday", "owner_name"].includes(key))
    .map(([key, value]) => `- ${key}: ${value}`).join("\n");
  const items = (products || []).slice(0, 12).map(p => `- ${p.name}${p.price_text ? ` (${p.price_text})` : ""}`).join("\n") || "- (no items yet)";
  return [
    "Write the 'About us' text for a small shop's web page, from the facts below.",
    "Rules: 2 or 3 short, warm, simple sentences, in English. Use ONLY the facts below. Never invent years, awards, offers, prices, numbers, certificates or promises.",
    "Do not repeat the timings or the full address word for word. Do not use markdown, quotes or emojis.",
    "",
    "Shop facts:", known || "- (very little is known)",
    "",
    "Some items:", items
  ].join("\n");
}

export function cleanAbout(raw) {
  return clip(String(raw ?? "").replace(/[*_#>`]/g, "").replace(/\s+/g, " "), 400);
}

// Used when the AI is not available: a plain sentence from the facts, nothing invented.
export function templateAbout(facts, typeName) {
  const name = clip(facts?.shop_name, 80);
  if (!name) return "";
  const kind = clip(typeName || facts?.shop_type, 60).replace(/_/g, " ");
  const area = clip(facts?.address, 120).split(",").slice(-2).join(",").trim();
  const noun = !kind ? "local shop" : /shop|store|studio|centre|center|clinic|hotel|hall|garage|academy|salon|parlour|school|institute|kitchen/i.test(kind) ? kind.toLowerCase() : `${kind.toLowerCase()} shop`;
  return cleanAbout(`${name} is a ${noun}${area ? ` in ${area}` : ""}. Ask our assistant about items, prices and timings in your language.`);
}
