// Builds the combined "Electronics store" question list (botcraft-banks/electronics_store.json).
//
//   node scripts/build-electronics-store-bank.mjs
//
// A shop that sells mobiles, laptops, TVs, fridges and accessories needs the questions of three lists at once:
// the electronics showroom, the mobile shop and the computer shop. This merges them (near-duplicate
// questions are kept once, with the highest priority) and adds questions customers ask that none of the
// three had. The result is a normal bank file; it is rebuilt by running this script again.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bankDir = join(root, "botcraft-banks");
const KEY = "electronics_store";
const NAME = "Electronics store (mobiles, laptops, TVs, fridges & accessories)";
const SOURCES = ["appliances_showroom", "mobile_shop", "computer_shop"];
const RANK = { mandatory: 0, important: 1, optional: 2 };

// Questions customers of such a shop ask that none of the three lists had.
const EXTRA = [
  { category: "Products & brands", priority: "important", answer_type: "text", owner_question: "Do your phones support 5G, dual SIM and eSIM? How do customers check this for a model?", customer_question: "Does this phone support 5G, dual SIM or eSIM?" },
  { category: "Buying advice", priority: "important", answer_type: "text", owner_question: "How do you help a customer choose a phone or laptop for their budget and need (for example under Rs 20,000, for study, gaming, camera or office work)?", customer_question: "Which phone or laptop is good for my budget?" },
  { category: "Products & brands", priority: "important", answer_type: "text", owner_question: "What comes in the box with phones and laptops (charger, earphones, cover, bag)? Is anything not included?", customer_question: "Is the charger included in the box?" },
  { category: "Products & brands", priority: "important", answer_type: "text", owner_question: "Do your laptops come with genuine Windows? Is MS Office included, or charged extra?", customer_question: "Does the laptop come with Windows and MS Office?" },
  { category: "Products & brands", priority: "important", answer_type: "text", owner_question: "Can you tell a customer which charger, cover, screen guard or bag fits their phone or laptop model?", customer_question: "Is this charger, cover or bag compatible with my model?" },
  { category: "Warranty & service", priority: "important", answer_type: "text", owner_question: "Do accessories (chargers, earbuds, power banks, cables) have a warranty, and can they be returned or replaced?", customer_question: "Is there a warranty or return on accessories?" },
  { category: "Prices & bills", priority: "important", answer_type: "text", owner_question: "Do you give discounts for students, corporate or bulk orders, or to government employees?", customer_question: "Do you give a student, corporate or bulk discount?" },
  { category: "Warranty & service", priority: "important", answer_type: "text", owner_question: "Do you replace phone screens and batteries in the shop? Roughly what does it cost for popular models, and how long does it take?", customer_question: "How much is a screen or battery replacement?" },
  { category: "Prices & bills", priority: "important", answer_type: "text", owner_question: "Do you buy old phones or laptops (buyback)? How is the price decided and what proof does the customer need?", customer_question: "Will you buy my old phone or laptop?" },
  { category: "Products & brands", priority: "optional", answer_type: "text", owner_question: "Can customers upgrade the RAM or SSD of a laptop in your shop? What does it cost?", customer_question: "Can I upgrade the RAM or SSD of this laptop?" },
  { category: "Products & brands", priority: "optional", answer_type: "text", owner_question: "Do you give anything free with a laptop or phone (bag, mouse, tempered glass, cover)?", customer_question: "Is anything free with this laptop or phone?" },
  { category: "Buying & checking", priority: "optional", answer_type: "text", owner_question: "Do you help customers move their data and set up a new phone or laptop at the shop? Is it free?", customer_question: "Will you transfer my data to the new phone?" },
  { category: "Shop & service", priority: "optional", answer_type: "text", owner_question: "Do you offer mobile recharge, new SIM cards or bill payments in the shop?", customer_question: "Do you do mobile recharge or SIM cards?" },
  { category: "Shop & service", priority: "optional", answer_type: "list", owner_question: "Which languages can your staff speak with customers?", customer_question: "Can someone help me in Telugu, Hindi or English?", options: ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"] }
];

// The first question must offer phones, laptops and accessories as well as appliances.
const PRODUCT_OPTIONS = ["Mobile phones", "Laptops", "Desktop computers & printers", "TVs", "Refrigerators", "Washing machines", "ACs",
  "Microwaves / ovens", "Water purifiers", "Kitchen appliances (mixie, grinder, induction)", "Fans & coolers", "Soundbars & speakers",
  "Smart watches & earbuds", "Mobile accessories (chargers, covers, screen guards)", "Computer accessories (mouse, keyboard, bags, pen drives)"];

// Words that say nothing about the topic, so "Which X types do you sell?" and "Which Y types do you sell?" are different questions.
const FILLER = new Set(["which", "what", "how", "does", "your", "you", "the", "are", "and", "for", "with", "that", "this", "have", "can", "any", "customers", "customer", "shop", "sell", "stock", "keep", "give", "from", "they", "their", "when", "will", "there", "about", "not", "also", "all"]);
const words = text => new Set(String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter(w => w.length > 1 && !FILLER.has(w)));
const similar = (a, b) => {
  const x = words(a), y = words(b);
  if (x.size < 3 || y.size < 3) return false;
  const shared = [...x].filter(w => y.has(w)).length;
  return shared / new Set([...x, ...y]).size >= 0.7;
};

const merged = [];
const dropped = [];
for (const source of SOURCES) {
  const bank = JSON.parse(readFileSync(join(bankDir, `${source}.json`), "utf8"));
  for (const q of bank.questions) {
    const sameText = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
    const twin = merged.find(m => sameText(m.owner_question, q.owner_question) || m.customer_question === q.customer_question || similar(m.owner_question, q.owner_question));
    if (twin) {
      dropped.push([q.owner_question, twin.owner_question]);
      // The same question: keep one, with the higher priority and the longer options list.
      if (RANK[q.priority] < RANK[twin.priority]) twin.priority = q.priority;
      if ((q.options?.length || 0) > (twin.options?.length || 0)) twin.options = q.options;
      continue;
    }
    const { id, ...rest } = q;
    merged.push({ ...rest });
  }
}
for (const q of EXTRA) if (!merged.some(m => similar(m.owner_question, q.owner_question))) merged.push({ ...q });

// Mandatory first, then important, then optional; within a priority the order of the three lists is kept.
const first = merged.find(q => q.owner_question === "Which products do you sell?");
if (first) first.options = PRODUCT_OPTIONS;
const ordered = ["mandatory", "important", "optional"].flatMap(p => merged.filter(q => q.priority === p));
const questions = ordered.map((q, i) => ({ id: `${KEY}-${String(i + 1).padStart(3, "0")}`, ...q }));
const record = {
  shop_type_key: KEY, name: NAME, version: 1, model: "merged", generated_at: new Date().toISOString().slice(0, 10),
  question_count: questions.length, questions
};
writeFileSync(join(bankDir, `${KEY}.json`), JSON.stringify(record, null, 1));

// Rebuild the index of banks (same as scripts/generate-botcraft-banks.mjs).
const names = readdirSync(bankDir).filter(f => f.endsWith(".json")).sort().map(f => f.replace(/\.json$/, ""));
const ident = n => "bank_" + n.replace(/[^a-z0-9]/g, "_");
writeFileSync(join(bankDir, "index.js"),
  "// Generated by scripts/generate-botcraft-banks.mjs. Do not edit by hand.\n" +
  names.map(n => `import ${ident(n)} from "./${n}.json" with { type: "json" };`).join("\n") +
  "\n\nexport const QUESTION_BANKS = {\n" + names.map(n => `  ${JSON.stringify(n)}: ${ident(n)}`).join(",\n") + "\n};\n");
if (process.argv.includes("--show-merged")) dropped.forEach(([a, b]) => console.log(`  merged: ${a.slice(0, 80)}\n      into: ${b.slice(0, 80)}`));
const count = p => questions.filter(q => q.priority === p).length;
console.log(`${KEY}: ${questions.length} questions (${count("mandatory")} mandatory, ${count("important")} important, ${count("optional")} optional); index: ${names.length} banks`);
