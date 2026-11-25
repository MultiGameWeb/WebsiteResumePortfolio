// Shops with many items send only the items related to the question in full (see shopKnowledge in botcraft-salesbot.js).
import { FULL_ITEMS, TRIM_FROM, publicProfile, salesbotPrompt, shopKnowledge } from '../botcraft-salesbot.js';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };

const kinds = ['Smart Phone', 'Laptop', 'Smart TV', 'Fridge', 'Washing Machine', 'Air Cooler', 'Headphones', 'Speaker', 'Charger', 'Fan'];
const shopWith = (n, answers = 0) => ({
  facts: { shop_name: 'Sri Balaji Electronics', shop_type: 'electronics_store', address: 'Main Road, Kurnool', timings: '10 AM to 9 PM', call_number: '9876543210' },
  notes: ['Diwali offer: TVs 43 inch and above get ₹2,000 off'],
  answers: Object.fromEntries(Array.from({ length: answers }, (_, i) => [`q${i}`, 'Yes, available with 1 year warranty and a bill.'])),
  ownerAnswers: [],
  products: Array.from({ length: n }, (_, i) => ({ name_key: `item ${i}`, name: `Brand${i} Model ${i} ${kinds[i % kinds.length]}`, price_text: `₹${(5000 + i * 137).toLocaleString('en-IN')}`, details: '6.5 inch display | 50MP camera | 5000mAh battery | 1 year warranty | bill provided', stock_status: 'in_stock' }))
});
const bank = { questions: Array.from({ length: 60 }, (_, i) => ({ id: `q${i}`, owner_question: `Do you offer service number ${i + 1}?` })) };
const names = shop => shop.products.map(p => p.name);

const small = shopWith(TRIM_FROM, 30);
ok(`a shop with ${TRIM_FROM} items or fewer is never cut`, shopKnowledge(small, bank, 'Electronics store', { focus: 'smart tv price' }) === shopKnowledge(small, bank, 'Electronics store'));

const big = shopWith(200, 60);
const full = shopKnowledge(big, bank, 'Electronics store');
const cut = shopKnowledge(big, bank, 'Electronics store', { focus: 'Brand7 Model 7 price?' });
ok('a big shop is cut when there is a question', cut.length < full.length * 0.6, `${cut.length} of ${full.length}`);
ok('every item is still listed (nothing is lost)', names(big).every(name => cut.includes(name)));
ok('the item asked about comes with its details', /Brand7 Model 7 Fridge — ₹[\d,]+ — 6\.5 inch/.test(cut) === false ? /Brand7 Model 7 [A-Za-z ]+ — ₹[\d,]+ — 6\.5 inch display/.test(cut) : true);
const fullLines = (cut.match(/ — 6\.5 inch display/g) || []).length;
ok(`at most ${FULL_ITEMS} items carry full details`, fullLines <= FULL_ITEMS && fullLines >= 1, String(fullLines));
ok('other items are listed by name and price only', /Other items \(name and price only/.test(cut) && !/Brand199 Model 199 [A-Za-z ]+ — ₹[\d,]+ — 6\.5/.test(cut));
ok('shop facts, offers and saved answers are all still there', cut.includes('Diwali offer') && cut.includes('Kurnool') && cut.includes('service number 60'));

const tv = shopKnowledge(big, bank, 'Electronics store', { focus: 'smart tv offers' });
ok('a question about a kind of item shows those items in full', (tv.match(/Smart TV — ₹[\d,]+ — 6\.5 inch/g) || []).length >= 10, String((tv.match(/Smart TV — ₹[\d,]+ — 6\.5 inch/g) || []).length));
const chosen = shopKnowledge(big, bank, 'Electronics store', { focus: 'is it good?', productKey: 'item 150' });
ok('the item the customer is looking at is always in full', /Brand150 Model 150 [A-Za-z ]+ — ₹[\d,]+ — 6\.5 inch/.test(chosen));
const vague = shopKnowledge(big, bank, 'Electronics store', { focus: 'any offers today?' });
ok('a question that matches no item still shows some items in full and lists all', (vague.match(/ — 6\.5 inch display/g) || []).length >= 8 && names(big).every(name => vague.includes(name)));
ok('without any text to match (voice) nothing is cut', shopKnowledge(big, bank, 'Electronics store', { focus: '' }) === full);
const out = shopWith(200, 0); out.products[7].stock_status = 'out_of_stock'; out.products[8].qty = 2;
const flags = shopKnowledge(out, bank, 'Electronics store', { focus: 'Brand150 price' });
ok('out of stock and low stock still show on the short lines', /Brand7 Model 7 [A-Za-z ]+ — ₹[\d,]+ \(out of stock\)/.test(flags) && /Brand8 Model 8 [A-Za-z ]+ — ₹[\d,]+ \(only 2 left\)/.test(flags));

const profile = publicProfile(big.facts, 'Electronics store', []);
const promptFull = salesbotPrompt(profile, full, null, 'electronics_store').length;
const promptCut = salesbotPrompt(profile, cut, null, 'electronics_store').length;
console.log(`INFO  200 items, 60 answers: prompt ${promptFull} -> ${promptCut} characters (${Math.round((1 - promptCut / promptFull) * 100)}% less)`);
const mid = shopWith(60, 50), midFull = shopKnowledge(mid, bank, 'Electronics store'), midCut = shopKnowledge(mid, bank, 'Electronics store', { focus: 'Brand5 Model 5 price' });
console.log(`INFO  60 items, 50 answers: ${salesbotPrompt(profile, midFull, null, 'electronics_store').length} -> ${salesbotPrompt(profile, midCut, null, 'electronics_store').length} characters`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
