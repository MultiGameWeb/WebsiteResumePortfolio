// Owner Update mode: the owner writes (or speaks, or sends a photo) "Gold chain
// price 52000" and BotCraft works out WHAT to change. Nothing is changed here:
// the plan is shown to the owner, who confirms it on the owner page.
//
// This file holds the pure parts (schema, prompt, validation) so they can be
// tested without a database or an AI key.

export const INFO_FIELDS = {
  timings: 120, weekly_holiday: 60, address: 200, call_number: 20, whatsapp_number: 20, map_link: 300, about: 400
};
const OP_TYPES = ["set_price", "set_stock", "set_details", "add_item", "delete_item", "set_info", "rename_bot", "attach_photo"];
const PHOTO_KINDS = ["product", "main", "owner", "gallery"];
const MAX_OPS = 12;

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
          field: { type: "STRING", enum: Object.keys(INFO_FIELDS), description: "which shop information to change (set_info)" },
          value: { type: "STRING", description: "the new value (set_info, rename_bot)" },
          photo_kind: { type: "STRING", enum: PHOTO_KINDS, description: "where a sent photo goes (attach_photo)" },
          image: { type: "INTEGER", description: "0-based number of the photo the owner sent (attach_photo)" }
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

export function buildPlanPrompt(products, info, imageCount) {
  const items = (products || []).slice(0, 200).map(p => `- ${p.name}${p.price_text ? ` | ${p.price_text}` : ""}${p.stock_status === "out_of_stock" ? " | out of stock" : ""}`).join("\n") || "- (no items yet)";
  const known = Object.entries(info || {}).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- (nothing saved yet)";
  return [
    "You help a shop owner update their shop assistant. The owner writes or speaks (English, Telugu, Hindi or mixed) and may send photos.",
    "Turn the message into a short list of changes. Do NOT chat. Never invent prices, names or details the owner did not say.",
    "Operations:",
    "- set_price: change an existing item's price (name, price).",
    "- set_stock: mark an existing item finished (out_of_stock true) or back in stock (false).",
    "- set_details: change an existing item's details text.",
    "- add_item: a NEW item (name, price, details). Use it only when the owner clearly adds something new.",
    "- delete_item: remove an existing item, only when the owner clearly says delete/remove.",
    "- set_info: change shop information. field is one of: timings, weekly_holiday, address, call_number, whatsapp_number, map_link, about.",
    "- rename_bot: the assistant's name (value).",
    `- attach_photo: a photo the owner sent (image = 0-based number, ${imageCount} sent). photo_kind: product (name = the item it shows), main (shop front), owner (the owner), gallery.`,
    "Use the EXACT item name from the list below when the owner means an existing item. Prices keep the rupee sign and Indian digit grouping (₹52,000).",
    "If the owner's message is unclear or an item is not in the list, add a short question in `unclear` and leave that change out.",
    "Write `summary` in the owner's language.",
    "",
    "Current items:", items,
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
export function cleanPlan(raw, products, imageCount = 0) {
  const ops = [];
  const dropped = [];
  for (const op of (Array.isArray(raw?.ops) ? raw.ops : []).slice(0, MAX_OPS)) {
    const type = String(op?.type || "");
    if (!OP_TYPES.includes(type)) continue;
    if (type === "add_item") {
      const name = clip(op.name, 120);
      if (!name) continue;
      ops.push({ type, name, price: clip(op.price, 80), details: clip(op.details, 600) });
    } else if (type === "set_price" || type === "set_stock" || type === "set_details" || type === "delete_item") {
      const product = findProduct(products, op.name);
      if (!product) { dropped.push(clip(op.name, 120)); continue; }
      if (type === "set_price") {
        const price = clip(op.price, 80);
        if (!price) continue;
        ops.push({ type, name: product.name, key: product.name_key, price });
      } else if (type === "set_stock") ops.push({ type, name: product.name, key: product.name_key, out_of_stock: op.out_of_stock !== false });
      else if (type === "set_details") ops.push({ type, name: product.name, key: product.name_key, details: clip(op.details, 600) });
      else ops.push({ type, name: product.name, key: product.name_key });
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
  const unclear = clip(raw?.unclear, 300) || (dropped.length ? `I could not find ${dropped.map(n => `“${n}”`).join(", ")} in your items. Please check the name.` : "");
  return { summary: clip(raw?.summary, 300), ops, unclear };
}
