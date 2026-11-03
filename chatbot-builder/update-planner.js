// Owner Update mode, offline helper: turns a short message like
// "Gold chain price 52000" or "paneer out of stock" into a list of changes,
// using plain rules (English, Telugu and Hindi words). No AI, no server.
//
// It is the fallback when the AI helper is not available (and the whole helper
// in demo mode). Whatever it understands is only a PLAN: the owner page shows
// it and the owner must confirm before anything is saved.

const WEEKDAYS = [
  ['Sunday', /\b(sunday|sun)\b|ఆదివారం|रविवार/i], ['Monday', /\b(monday|mon)\b|సోమవారం|सोमवार/i], ['Tuesday', /\b(tuesday|tue|tues)\b|మంగళవారం|मंगलवार/i],
  ['Wednesday', /\b(wednesday|wed)\b|బుధవారం|बुधवार/i], ['Thursday', /\b(thursday|thu|thurs)\b|గురువారం|गुरुवार/i],
  ['Friday', /\b(friday|fri)\b|శుక్రవారం|शुक्रवार/i], ['Saturday', /\b(saturday|sat)\b|శనివారం|शनिवार/i]
];

const KW = {
  price: /\b(price|rate|cost|mrp|amount|dhara|ret|rupees|rs)\b|ధర|రేటు|రేట్|కాస్ట్|कीमत|दाम|भाव|रेट/i,
  out: /\b(out of stock|no stock|stock (?:is )?(?:over|finished|empty|less)|finished|sold out|not available|unavailable|over|stock ledu|ayipoyindi|ayipoyindhi|aipoyindi)\b|స్టాక్ లేదు|అయిపోయింది|అయిపోయిన|లేదు|खत्म|स्टॉक नहीं|उपलब्ध नहीं/i,
  back: /\b(back in stock|in stock|available again|available|stock (?:came|arrived|vachindi|undi)|restocked|new stock)\b|స్టాక్ ఉంది|స్టాక్ వచ్చింది|అందుబాటులో|उपलब्ध|स्टॉक आ गया/i,
  del: /\b(delete|remove|drop|tholagimchu|teesey|teeseyi)\b|తొలగించు|తీసేయి|తీసివేయి|డిలీట్|हटा|हटाएं|हटाओ|डिलीट/i,
  add: /^\s*(add|new item|new|create|insert|jodinchu)\b|^\s*(జోడించు|కొత్త|యాడ్|जोड़ें|जोड़|नया)/i,
  timings: /\b(timings?|timing|opening hours?|open(?:s|ing)?|hours|working hours)\b|టైమింగ్స్|సమయం|సమయాలు|समय|खुलने/i,
  holiday: /\b(holiday|weekly off|off day|closed on|closed every|closed)\b|సెలవు|छुट्टी|बंद/i,
  address: /^\s*(?:shop |our )?(address|location)\b[\s:,-]*|^\s*(చిరునామా|पता)[\s:,-]*/i,
  phone: /\b(phone|call|mobile|contact)\b|ఫోన్|కాల్|फोन|कॉल/i,
  whatsapp: /\b(whatsapp|whats app)\b|వాట్సాప్|व्हाट्सएप|वॉट्सऐप/i,
  about: /^\s*(?:about(?: us| shop| the shop)?|description|shop description)\b[\s:,-]*|^\s*(మా గురించి|గురించి|हमारे बारे में)[\s:,-]*/i,
  bot: /\b(bot name|assistant name|rename (?:the )?bot|bot peru)\b[\s:,-]*(?:to|is|=)?\s*/i,
  details: /\b(details?|description|specs?|about)\b|వివరాలు|विवरण/i
};

const PHOTO_TARGET = /\b(main photo|shop photo|shop front|front photo|front|banner|cover|signboard|board|my photo|owner photo|owner|about me|gallery|interior|inside|more photos|shop photos|photos? of|photo|photos|picture|pic)\b|మెయిన్|గ్యాలరీ|ఫోటో/i;
const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'is', 'are', 'for', 'my', 'our', 'please', 'now', 'set', 'change', 'update', 'make', 'put', 'mark', 'as', 'at', 'in', 'on', 'and', 'it',
  'price', 'rate', 'cost', 'mrp', 'rs', 'rupees', 'inr', 'out', 'stock', 'of', 'finished', 'sold', 'over', 'add', 'new', 'item', 'delete', 'remove', 'details', 'detail', 'description', 'available',
  'back', 'again', 'no', 'not', 'was', 'now', 'is', 'only', 'just', 'ayyindi', 'ayindi', 'chey', 'cheyyi', 'ledu', 'undi', 'ippudu']);

const norm = (text) => String(text || '').toLowerCase().replace(/[^\p{L}\p{N}\s.]/gu, ' ').replace(/\s+/g, ' ').trim();
const tokens = (text) => norm(text).replace(/\./g, ' ').split(' ').filter(Boolean);
const contentTokens = (text) => tokens(text).filter((t) => !STOP.has(t) && !/^\d+$/.test(t) && (t.length > 1 || /\p{L}/u.test(t)));

export function formatPrice(number) {
  const n = Number(number);
  if (!Number.isFinite(n)) return '';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// Finds a rupee amount in a text: ₹52,000 · rs 3500 · 52k · 1.5 lakh. Returns { text, index, length } or null.
export function findMoney(text) {
  const source = String(text || '');
  const range = source.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*)\s*(?:-|–|to)\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i);
  const pattern = /(₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|l|cr|crores?)?(?![\p{L}\d])/giu;
  let best = null;
  let match;
  while ((match = pattern.exec(source))) {
    const unit = (match[3] || '').toLowerCase();
    let value = Number(match[2].replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    if (unit === 'k' || unit === 'thousand') value *= 1000;
    else if (/^la/.test(unit) || unit === 'l') value *= 100000;
    else if (/^cr/.test(unit)) value *= 10000000;
    const hasSign = Boolean(match[1]);
    // A plain small number such as the "22" in "22k gold" is not a price unless it has a rupee sign.
    const candidate = { value, hasSign, index: match.index, length: match[0].length, text: formatPrice(value) };
    if (!best || hasSign && !best.hasSign || (hasSign === best.hasSign && match.index > best.index)) best = candidate;
  }
  if (!best) return null;
  if (range && !/[a-z]/i.test(range[0].replace(/rs|inr|to/gi, ''))) {
    const a = Number(range[1].replace(/,/g, '')), b = Number(range[2].replace(/,/g, ''));
    if (a && b && a < b) return { text: `${formatPrice(a)}–${formatPrice(b)}`, index: range.index, length: range[0].length, value: a, hasSign: true };
  }
  return best;
}

// Which existing item does a clause talk about? Returns { product, ambiguous, matchedTokens }.
export function matchProduct(clause, products) {
  const wanted = new Set(contentTokens(clause));
  if (!wanted.size) return { product: null, ambiguous: [] };
  const scored = (products || []).map((product) => {
    const own = contentTokens(product.name);
    const hits = own.filter((t) => wanted.has(t) || [...wanted].some((w) => w.length > 3 && (t.startsWith(w) || w.startsWith(t))));
    return { product, hits, own, score: hits.length / Math.max(1, own.length) + hits.length };
  }).filter((entry) => entry.hits.length > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) return { product: null, ambiguous: [] };
  const top = scored[0];
  const tied = scored.filter((entry) => Math.abs(entry.score - top.score) < 0.001);
  if (tied.length > 1) return { product: null, ambiguous: tied.map((entry) => entry.product.name).slice(0, 3) };
  return { product: top.product, ambiguous: [], matchedTokens: top.hits };
}

function formatTime(hour, minute, suffix) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${suffix}`;
}

// "9 to 9", "10am-8:30pm", "9:00 - 21:00" → "9:00 AM – 9:00 PM". Returns '' when unsure.
export function formatTimings(text) {
  const matches = [...String(text || '').matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/gi)];
  if (matches.length < 2) return '';
  const parse = (m) => ({ hour: Number(m[1]), minute: Number(m[2] || 0), suffix: m[3] ? (/p/i.test(m[3]) ? 'PM' : 'AM') : '' });
  const a = parse(matches[0]), b = parse(matches[1]);
  if (a.hour > 24 || b.hour > 24 || a.minute > 59 || b.minute > 59) return '';
  if (a.hour >= 13 || b.hour >= 13) {
    const toAmPm = (t) => formatTime(t.hour, t.minute, t.hour >= 12 && t.hour < 24 ? 'PM' : 'AM');
    return `${toAmPm(a)} – ${toAmPm(b)}`;
  }
  const first = a.suffix || 'AM';
  const second = b.suffix || (b.hour <= a.hour || a.hour < 12 ? 'PM' : 'AM');
  return `${formatTime(a.hour, a.minute, first)} – ${formatTime(b.hour, b.minute, second)}`;
}

function splitClauses(text) {
  return String(text || '')
    .split(/\n+|;|\.\s+(?=[A-Za-z\u0C00-\u0C7F\u0900-\u097F])|\s+and\s+(?=(?:add|delete|remove|set|change|update|mark|price|timings?|holiday|phone|whatsapp)\b)|\s*&\s*(?=(?:add|delete|remove)\b)/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function stripItemName(clause, product) {
  let rest = clause;
  const own = String(product.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  rest = rest.replace(new RegExp(own, 'i'), ' ');
  for (const token of contentTokens(product.name)) rest = rest.replace(new RegExp(`(^|[^\\p{L}\\d])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\d])`, 'iu'), ' ');
  return rest;
}

function addItemFromClause(clause) {
  let body = clause;
  for (let i = 0; i < 4; i++) body = body.replace(/^\s*(add|new|create|insert|item|product|jodinchu|జోడించు|కొత్త|యాడ్|जोड़ें|जोड़|नया|an?)\b\s*[:\-]?\s*/i, '');
  body = body.trim();
  const money = findMoney(body.replace(/(\d)\s*k\b(?=[a-z])/i, '$1k'));
  let name = body;
  let price = '';
  let details = '';
  if (money) {
    name = body.slice(0, money.index).replace(/(?:₹|rs\.?|inr|at|for|price|rate|@|=|-|:)\s*$/i, '').trim();
    price = money.text;
    details = body.slice(money.index + money.length).replace(/^[\s,:\-–]+/, '').trim();
  }
  name = name.replace(/[,:\-–]+$/, '').trim();
  return { name: name.slice(0, 120), price, details: details.slice(0, 600) };
}

function weekdayIn(text) {
  const hit = WEEKDAYS.find(([, pattern]) => pattern.test(text));
  return hit ? hit[0] : '';
}

// Plans changes for one message. `images` is how many photos were attached.
export function planLocally(text, { products = [], imageCount = 0 } = {}) {
  const ops = [];
  const questions = [];
  const lowerAll = String(text || '').toLowerCase();
  let pendingNew = []; // add_item ops that may get a photo

  const clauses = [];
  for (const clause of splitClauses(text)) {
    // "gold ring out of stock and silver anklet price 4000": split when both halves make sense alone.
    const halves = clause.split(/\s+and\s+|\s*,\s+(?=[A-Za-z])/i);
    if (halves.length > 1 && !KW.add.test(clause) && halves.every((half) => planLocally(half, { products }).ops.length > 0)) clauses.push(...halves);
    else clauses.push(clause);
  }
  for (const clause of clauses) {
    const lower = clause.toLowerCase();

    // ---- Shop information ----
    const urlMatch = clause.match(/https?:\/\/\S+/i);
    if (urlMatch && /maps|goo\.gl|g\.page/i.test(urlMatch[0])) { ops.push({ type: 'set_info', field: 'map_link', value: urlMatch[0] }); continue; }
    const botMatch = clause.match(KW.bot);
    if (botMatch) { const value = clause.slice(botMatch.index + botMatch[0].length).trim(); if (value) { ops.push({ type: 'rename_bot', value: value.slice(0, 40) }); continue; } }
    const aboutMatch = clause.match(KW.about);
    if (aboutMatch && clause.length > aboutMatch[0].length + 5) { ops.push({ type: 'set_info', field: 'about', value: clause.slice(aboutMatch[0].length).trim().slice(0, 400) }); continue; }
    const addressMatch = clause.match(KW.address);
    if (addressMatch && clause.length > addressMatch[0].length + 3) { ops.push({ type: 'set_info', field: 'address', value: clause.slice(addressMatch[0].length).trim().slice(0, 200) }); continue; }
    const phoneDigits = (clause.replace(/[\s\-()]/g, '').match(/(?:\+?91)?(\d{10})(?!\d)/) || [])[1];
    if (phoneDigits && KW.whatsapp.test(lower)) { ops.push({ type: 'set_info', field: 'whatsapp_number', value: phoneDigits }); continue; }
    if (phoneDigits && KW.phone.test(lower)) { ops.push({ type: 'set_info', field: 'call_number', value: phoneDigits }); continue; }
    if (KW.holiday.test(lower) && !KW.timings.test(lower.replace(/closed/g, ''))) {
      if (/\b(no holiday|open all days|open every day|everyday|all days)\b|సెలవు లేదు/i.test(clause)) { ops.push({ type: 'set_info', field: 'weekly_holiday', value: 'No weekly holiday' }); continue; }
      const day = weekdayIn(clause);
      if (day) { ops.push({ type: 'set_info', field: 'weekly_holiday', value: day }); continue; }
    }
    if (KW.timings.test(lower) && /\d/.test(clause) && !findProductByWord(clause, products)) {
      const value = formatTimings(clause);
      if (value) { ops.push({ type: 'set_info', field: 'timings', value }); }
      else questions.push(`I could not read the timings in “${clause}”. Please write them like “10 am to 8:30 pm”.`);
      continue;
    }

    // ---- Items ----
    if (KW.add.test(clause)) {
      const item = addItemFromClause(clause);
      if (!item.name) { questions.push('What is the name of the new item?'); continue; }
      const op = { type: 'add_item', name: item.name, price: item.price, details: item.details };
      ops.push(op);
      pendingNew.push(op);
      continue;
    }

    if (imageCount > 0 && PHOTO_TARGET.test(lower) && !findMoney(clause)) continue;
    const found = matchProduct(clause, products);
    if (found.ambiguous.length) { questions.push(`Which item do you mean: ${found.ambiguous.join(' or ')}?`); continue; }

    if (found.product) {
      const product = found.product;
      if (KW.del.test(lower)) { ops.push({ type: 'delete_item', name: product.name, key: product.name_key }); continue; }
      const wantsOut = KW.out.test(lower);
      const wantsBack = KW.back.test(lower) && !/\bnot available|unavailable\b/i.test(lower);
      const rest = stripItemName(clause, product);
      const money = findMoney(rest);
      const restWithoutMoney = money ? rest.slice(0, money.index) + ' ' + rest.slice(money.index + money.length) : rest;
      if (KW.details.test(lower) && !KW.price.test(lower)) {
        const details = rest.replace(KW.details, ' ').replace(/^[\s:\-–,]+/, '').replace(/^(of|is|to)\b\s*/i, '').trim();
        if (details) { ops.push({ type: 'set_details', name: product.name, key: product.name_key, details: details.slice(0, 600) }); continue; }
      }
      if (wantsOut && !wantsBack) { ops.push({ type: 'set_stock', name: product.name, key: product.name_key, out_of_stock: true }); continue; }
      if (wantsBack && !money) { ops.push({ type: 'set_stock', name: product.name, key: product.name_key, out_of_stock: false }); continue; }
      if (money && (KW.price.test(lower) || money.hasSign || /\b(to|now|is|at|=|@)\b|[:=]/i.test(rest) || contentTokens(restWithoutMoney).length === 0)) {
        ops.push({ type: 'set_price', name: product.name, key: product.name_key, price: money.text });
        if (wantsBack) ops.push({ type: 'set_stock', name: product.name, key: product.name_key, out_of_stock: false });
        continue;
      }
      if (KW.details.test(lower)) {
        const details = rest.replace(KW.details, ' ').replace(/^[\s:\-–,]+/, '').replace(/\b(of|is|to)\b\s*/i, '').trim();
        if (details) { ops.push({ type: 'set_details', name: product.name, key: product.name_key, details: details.slice(0, 600) }); continue; }
      }
      if (imageCount === 0) questions.push(`What should I change for ${product.name}? (price, stock or details)`);
      continue;
    }

    if (KW.del.test(lower)) { questions.push('I could not find that item to delete. Please write its name as it appears in your items.'); continue; }
    if (KW.price.test(lower) || (findMoney(clause) && /\p{L}/u.test(clause))) {
      questions.push(`I could not find the item in “${clause.slice(0, 60)}”. Please write the item name as it appears in your items, or say “add ${clause.slice(0, 30)}” to add it as a new item.`);
      continue;
    }
    if (KW.out.test(lower) || KW.back.test(lower)) { questions.push(`Which item is this about: “${clause.slice(0, 60)}”?`); continue; }
    questions.push(`I did not understand “${clause.slice(0, 60)}”. Try: “Gold chain price 52000”, “Silver anklet out of stock”, “Add Silk saree 3500” or “Timings 10 am to 8 pm”.`);
  }

  // ---- Photos the owner sent ----
  if (imageCount > 0) {
    const mentioned = matchProduct(String(text || ''), products);
    let kind = '';
    if (/\b(main photo|shop photo|shop front|front photo|front|banner|cover|signboard|board)\b|మెయిన్|దుకాణం ఫోటో/i.test(lowerAll)) kind = 'main';
    else if (/\b(my photo|owner photo|owner|about me)\b|నా ఫోటో|ఓనర్/i.test(lowerAll)) kind = 'owner';
    else if (/\b(gallery|interior|inside|more photos|shop photos|photos of)\b|గ్యాలరీ/i.test(lowerAll)) kind = 'gallery';
    for (let i = 0; i < imageCount; i++) {
      if (kind) ops.push({ type: 'attach_photo', kind, image: i });
      else if (pendingNew[i]) ops.push({ type: 'attach_photo', kind: 'product', image: i, name: pendingNew[i].name, key: '', forNewItem: true });
      else if (mentioned.product && i === 0) ops.push({ type: 'attach_photo', kind: 'product', image: i, name: mentioned.product.name, key: mentioned.product.name_key });
      else questions.push(i === 0 ? 'Where should the photo go? Say the item name, “main photo” or “gallery”.' : '');
    }
  }

  const clean = questions.filter(Boolean);
  const summary = ops.length ? `I understood ${ops.length} change${ops.length === 1 ? '' : 's'}.` : 'I could not find a change to make.';
  return { summary, ops, unclear: [...new Set(clean)].join(' ') };
}

function findProductByWord(clause, products) {
  const found = matchProduct(clause.replace(/open(s|ing)?|timings?|hours/gi, ' '), products);
  return found.product || found.ambiguous.length ? true : false;
}

// A readable line for each change (used on the confirm card).
export function describeOp(op, products = [], info = {}) {
  const find = (key) => products.find((p) => p.name_key === key);
  const FIELD_LABELS = { timings: 'Timings', weekly_holiday: 'Weekly holiday', address: 'Address', call_number: 'Phone', whatsapp_number: 'WhatsApp', map_link: 'Map link', about: 'About' };
  switch (op.type) {
    case 'set_price': { const old = find(op.key)?.price_text; return { icon: '₹', text: `${op.name}: price ${old ? `${old} → ` : ''}${op.price}` }; }
    case 'set_stock': return { icon: op.out_of_stock ? '⛔' : '✅', text: `${op.name}: mark ${op.out_of_stock ? 'out of stock' : 'back in stock'}` };
    case 'set_details': return { icon: '✎', text: `${op.name}: details → ${op.details}` };
    case 'add_item': return { icon: '＋', text: `Add new item: ${op.name}${op.price ? ` — ${op.price}` : ''}${op.details ? ` (${op.details})` : ''}` };
    case 'delete_item': return { icon: '🗑', text: `Delete item: ${op.name}`, danger: true };
    case 'set_info': { const old = info[op.field]; return { icon: 'ⓘ', text: `${FIELD_LABELS[op.field] || op.field}: ${old ? `${old} → ` : ''}${op.value}` }; }
    case 'rename_bot': return { icon: '🤖', text: `Assistant name → ${op.value}` };
    case 'attach_photo': {
      const where = { main: 'main shop photo', owner: 'owner photo', gallery: 'gallery', product: op.name ? `photo of ${op.name}` : 'item photo' }[op.kind];
      return { icon: '📷', text: `Photo ${op.image + 1} → ${where}` };
    }
    default: return { icon: '•', text: op.type };
  }
}
