// Writes seed.sql: one finished test shop (Vinay Jewellers) with two items, for e2e.mjs.
import { CORE_QUESTIONS } from "../botcraft-question-bank.js";
import { writeFileSync } from "node:fs";

const SHOP = "11111111-2222-4333-8444-555555555555";
const SHOP2 = "22222222-3333-4444-8555-666666666666"; // a second shop, deleted by the delete-bot checks
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
const SHOP3 = "33333333-4444-4555-8666-777777777777"; // deleted by the R2 delete-bot check
const second = { ...facts, shop_name: "Delete Me Stores", owner_name: "Tester" };
writeFileSync(process.argv[2] || "seed.sql", [
  `INSERT OR REPLACE INTO botcraft_shops (shop_id, shop_type, shop_name, facts_json, notes_json, created_at, updated_at) VALUES ('${SHOP3}','jewellery','R2 Delete Stores','${esc(JSON.stringify({ ...second, shop_name: "R2 Delete Stores" }))}','[]','${now}','${now}');`,
  `INSERT OR REPLACE INTO botcraft_shops (shop_id, shop_type, shop_name, facts_json, notes_json, created_at, updated_at) VALUES ('${SHOP2}','jewellery','Delete Me Stores','${esc(JSON.stringify(second))}','[]','${now}','${now}');`,
  `INSERT OR REPLACE INTO botcraft_products (shop_id, name_key, name, price_text, details, stock_status, created_at, updated_at) VALUES ('${SHOP2}','test item','Test Item','₹100','','in_stock','${now}','${now}');`,
  `INSERT OR REPLACE INTO botcraft_shops (shop_id, shop_type, shop_name, facts_json, notes_json, created_at, updated_at) VALUES ('${SHOP}','jewellery','Vinay Jewellers','${esc(JSON.stringify(facts))}','${esc(JSON.stringify(["Free cleaning for life"]))}','${now}','${now}');`,
  item("gold chain 22k", "Gold Chain 22K", "₹48,500", "10 grams"),
  item("silver anklet", "Silver Anklet", "₹3,200", "Pair")
].join("\n"));
