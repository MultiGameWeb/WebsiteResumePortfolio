// Writes seed.sql: one finished test shop (Vinay Jewellers) with two items, for e2e.mjs.
import { CORE_QUESTIONS } from "../botcraft-question-bank.js";
import { writeFileSync } from "node:fs";

const SHOP = "11111111-2222-4333-8444-555555555555";
const facts = {};
for (const q of CORE_QUESTIONS) facts[q.key] = q.type === "image" ? "photo received" : "Yes";
Object.assign(facts, {
  shop_name: "Vinay Jewellers", shop_type: "jewellery", owner_name: "Vinay", address: "12 Charminar Road, Hyderabad",
  timings: "10 AM - 8 PM", weekly_holiday: "Sunday", call_number: "9876543210", whatsapp_number: "9876543210",
  map_link: "https://maps.google.com/?q=charminar", offers: "10% off on Diwali", home_delivery: "Yes within 5 km", about: "Family jewellery shop."
});
const now = new Date().toISOString();
const esc = value => String(value).replace(/'/g, "''");
const item = (key, name, price, details) =>
  `INSERT OR REPLACE INTO botcraft_products (shop_id, name_key, name, price_text, details, stock_status, created_at, updated_at) VALUES ('${SHOP}','${key}','${esc(name)}','${esc(price)}','${esc(details)}','in_stock','${now}','${now}');`;
writeFileSync(process.argv[2] || "seed.sql", [
  `INSERT OR REPLACE INTO botcraft_shops (shop_id, shop_type, shop_name, facts_json, notes_json, created_at, updated_at) VALUES ('${SHOP}','jewellery','Vinay Jewellers','${esc(JSON.stringify(facts))}','${esc(JSON.stringify(["Free cleaning for life"]))}','${now}','${now}');`,
  item("gold chain 22k", "Gold Chain 22K", "₹48,500", "10 grams"),
  item("silver anklet", "Silver Anklet", "₹3,200", "Pair")
].join("\n"));
