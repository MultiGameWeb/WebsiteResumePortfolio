// BotCraft demo mode: a fake backend that lives in this browser, so the owner
// page and the customer page can be tried (and tested) without a server, a
// database or an AI key. It is switched on by ?demo=1 and then remembered.
//
// Both pages (same origin) share one state in localStorage, so a change made
// on the owner page shows on the customer page straight away.
//
// Load this as a normal <script> BEFORE the page's module script.
(function () {
  var FLAG = 'botcraft:demo';
  var STATE_KEY = 'botcraft:demo:v1';
  var params = new URLSearchParams(location.search);
  if (params.get('demo') === '0') { try { localStorage.removeItem(FLAG); } catch (e) {} }
  if (params.get('demo') === '1') { try { localStorage.setItem(FLAG, '1'); } catch (e) {} }
  var on = false;
  try { on = localStorage.getItem(FLAG) === '1'; } catch (e) {}
  if (!on) return;

  var BASE = 'https://botcraft-demo.invalid';
  window.BOTCRAFT_DEMO = true;
  window.BOTCRAFT_API_BASE = BASE;
  window.SALESBOT_API_BASE = BASE;
  try { localStorage.setItem('botcraft:shopId', 'demo-shop-private'); } catch (e) {}

  var PUBLIC_ID = 'demo-shop';
  var GALLERY_LIMIT = 10;

  function seed() {
    return {
      facts: {
        shop_name: 'Vinay Jewellers', shop_type: 'jewellery', bot_name: '',
        address: 'Shop 12, Charminar Road, Hyderabad', timings: '10:00 AM – 8:30 PM', weekly_holiday: 'Sunday',
        call_number: '9876543210', whatsapp_number: '9876543210', map_link: 'https://maps.google.com/?q=Charminar+Hyderabad',
        about: 'Family jewellery shop in the old city. Gold, silver and diamond jewellery since 1998, with free cleaning for life.'
      },
      products: [
        { name_key: 'gold-chain-22k', name: 'Gold Chain 22K', price_text: '₹48,500', details: '10 grams, hallmarked, making charges 8%.', stock_status: 'in_stock', photo_id: '' },
        { name_key: 'silver-anklet', name: 'Silver Anklet', price_text: '₹3,200', details: 'Pair, 92.5 purity, 60 grams.', stock_status: 'in_stock', photo_id: '' },
        { name_key: 'diamond-ring', name: 'Diamond Ring', price_text: '₹25,000', details: '0.25 carat, certified.', stock_status: 'out_of_stock', photo_id: '' }
      ],
      photos: [],
      notes: [
        { q: 'Do you exchange old gold?', a: 'Yes, old gold is exchanged at the market rate of the day.' },
        { q: 'Do you give a bill and hallmark certificate?', a: 'Yes, every item comes with a GST bill and a hallmark certificate.' }
      ],
      questions: [], answeredQuestions: [], requests: [], orders: [],
      features: { photo: true, preorder: false, orderStatus: true, voice: true, cart: false },
      savedAt: Date.now()
    };
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (saved && saved.facts && Array.isArray(saved.products)) return saved;
    } catch (e) {}
    var fresh = seed();
    save(fresh);
    return fresh;
  }
  function save(state) {
    state.savedAt = Date.now();
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
    catch (e) { throw new Error('This browser has no space left for demo photos. Remove some photos.'); }
  }
  function nameKey(name) {
    return String(name || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 140);
  }
  function clip(value, max) { return String(value == null ? '' : value).trim().slice(0, max); }
  function defaultBotName(facts) {
    var cleaned = String(facts.shop_name || 'Shop').replace(/\b(jewellers?|jewellery|store|shop|garments|traders|mart|stores)\b/gi, '').trim() || facts.shop_name || 'Shop';
    return cleaned + ' Assistant';
  }

  function ownerView(state) {
    var f = state.facts;
    return {
      ok: true,
      shopName: f.shop_name, botName: f.bot_name || defaultBotName(f), defaultBotName: defaultBotName({ shop_name: f.shop_name }),
      customBotName: f.bot_name || '', publicId: PUBLIC_ID,
      products: state.products.map(function (p) { return Object.assign({}, p, { photo_id: p.photo_id || '' }); }),
      photos: state.photos.map(function (p) { return { photo_id: p.photo_id, kind: p.kind, product_key: p.product_key || '' }; }),
      questions: state.questions, answeredQuestions: state.answeredQuestions,
      requests: {
        open: state.requests.filter(function (r) { return r.kind !== 'order' && ['new', 'accepted', 'ready'].indexOf(r.status) !== -1; }),
        closed: state.requests.filter(function (r) { return r.kind !== 'order' && ['done', 'rejected'].indexOf(r.status) !== -1; })
      },
      orders: state.orders, features: state.features, galleryLimit: GALLERY_LIMIT,
      info: {
        timings: f.timings || '', weekly_holiday: f.weekly_holiday || '', address: f.address || '',
        call_number: f.call_number || '', whatsapp_number: f.whatsapp_number || '', map_link: f.map_link || '', about: f.about || ''
      }
    };
  }

  function photoIdFor(state, kind, productKey) {
    var p = state.photos.find(function (x) { return x.kind === kind && (kind !== 'product' || x.product_key === productKey); });
    return p ? p.photo_id : '';
  }
  function syncProductPhotos(state) {
    state.products.forEach(function (p) { p.photo_id = photoIdFor(state, 'product', p.name_key); });
  }

  function publicView(state) {
    var f = state.facts;
    syncProductPhotos(state);
    var digits = function (v) { return String(v || '').replace(/\D/g, ''); };
    var faqs = [];
    if (f.timings) faqs.push({ q: 'What are your timings?', a: f.timings });
    if (f.weekly_holiday) faqs.push({ q: 'Which day is your weekly holiday?', a: f.weekly_holiday });
    if (f.address) faqs.push({ q: 'Where is your shop?', a: f.address });
    state.notes.forEach(function (n) { faqs.push({ q: n.q, a: n.a }); });
    state.answeredQuestions.forEach(function (q) { faqs.push({ q: q.question, a: q.answer }); });
    var main = state.photos.find(function (p) { return p.kind === 'main'; });
    var owner = state.photos.find(function (p) { return p.kind === 'owner'; });
    return {
      ok: true,
      shop: {
        name: f.shop_name, botName: f.bot_name || defaultBotName(f),
        mainPhoto: main ? main.photo_id : '', ownerPhoto: owner ? owner.photo_id : '',
        gallery: state.photos.filter(function (p) { return p.kind === 'gallery'; }).map(function (p) { return p.photo_id; }),
        type: 'Jewellery shop', address: f.address || '', timings: f.timings || '', weeklyHoliday: f.weekly_holiday || '',
        about: f.about || '', call: digits(f.call_number), whatsapp: digits(f.whatsapp_number) || digits(f.call_number),
        mapLink: f.map_link || '', features: state.features
      },
      offline: {
        faqs: faqs,
        items: state.products.map(function (p) {
          return { key: p.name_key, name: p.name, price: p.price_text || '', details: p.details || '', out: p.stock_status === 'out_of_stock', photo: p.photo_id || '' };
        }),
        savedAt: new Date(state.savedAt).toISOString()
      }
    };
  }

  // A tiny stand-in for the AI: plain word matching over the shop's data.
  var STOP = ['you','the','are','any','have','can','with','for','this','that','what','how','much','does','did','your','our','and','not','there','get','give','sell','buy','want','need','please','tell','about','show','from','will','shop','store'];
  function words(text) { return String(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(function (w) { return w.length > 2 && STOP.indexOf(w) === -1; }); }
  function demoAnswer(state, text, productKey) {
    var f = state.facts, pub = publicView(state), q = String(text).toLowerCase();
    var line = function (p) { return '• ' + p.name + (p.price ? ' — ' + p.price : '') + (p.out ? ' (out of stock)' : ''); };
    var items = pub.offline.items;
    if (productKey) {
      var it = items.find(function (x) { return x.key === productKey; });
      if (it) return it.name + (it.price ? ' costs ' + it.price + '.' : '.') + (it.details ? ' ' + it.details : '') + (it.out ? ' Sorry, it is out of stock right now.' : '');
    }
    if (/timing|open|close|time|ఎప్పుడు|సమయం|టైమ్/.test(q)) return 'We are open ' + (f.timings || 'daily') + (f.weekly_holiday ? '. Weekly holiday: ' + f.weekly_holiday + '.' : '.');
    if (/address|where|location|map|direction|ఎక్కడ|చిరునామా/.test(q)) return (f.address || 'Please ask at the counter.');
    if (/phone|call|number|whatsapp|contact|నంబర్/.test(q)) return 'You can call or WhatsApp us on ' + (f.call_number || 'the number shown at the top') + '.';
    if (/what.*(sell|have)|items|price list|catalog|products|అన్ని|ధరలు/.test(q)) return items.length ? 'Here is what we have:\n' + items.slice(0, 20).map(line).join('\n') : 'The item list is not ready yet.';
    var asked = words(q);
    var score = function (t) { var target = words(t); return asked.filter(function (w) { return target.some(function (o) { return o.indexOf(w) !== -1 || w.indexOf(o) !== -1; }); }).length; };
    var hits = items.map(function (x) { return { x: x, s: score(x.name + ' ' + x.details) }; }).filter(function (h) { return h.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 5);
    if (hits.length) return hits.map(function (h) { return line(h.x) + (h.x.details ? '\n  ' + h.x.details : ''); }).join('\n');
    var faq = pub.offline.faqs.map(function (x) { return { x: x, s: score(x.q) * 2 + score(x.a) }; }).filter(function (h) { return h.s > 0; }).sort(function (a, b) { return b.s - a.s; })[0];
    if (faq) return faq.x.a;
    return null;
  }

  var INFO_KEYS = { timings: 120, weekly_holiday: 60, address: 200, call_number: 20, whatsapp_number: 20, map_link: 300, about: 400 };

  function handleOwner(state, body) {
    var action = String(body.action || '');
    if (action === 'save_product') {
      var name = clip(body.name, 120);
      if (!name) throw new Error('Please enter the item name.');
      var key = clip(body.key, 140);
      var newKey = nameKey(name);
      var existing = state.products.find(function (p) { return p.name_key === (key || newKey); });
      var record = { name_key: newKey, name: name, price_text: clip(body.price_text, 80), details: clip(body.details, 600), stock_status: body.stock_status === 'out_of_stock' ? 'out_of_stock' : 'in_stock', photo_id: '' };
      if (existing) {
        state.photos.forEach(function (p) { if (p.kind === 'product' && p.product_key === existing.name_key) p.product_key = newKey; });
        Object.assign(existing, record);
      } else state.products.unshift(record);
      syncProductPhotos(state);
    } else if (action === 'delete_product') {
      var dkey = clip(body.key, 140);
      state.products = state.products.filter(function (p) { return p.name_key !== dkey; });
      state.photos = state.photos.filter(function (p) { return !(p.kind === 'product' && p.product_key === dkey); });
    } else if (action === 'upload_photo') {
      var kind = String(body.kind || '');
      if (['main', 'owner', 'gallery', 'product'].indexOf(kind) === -1 || !body.image || !body.image.data) throw new Error('Please choose a JPG, PNG or WebP photo.');
      var id = 'data:' + (body.image.mimeType || 'image/jpeg') + ';base64,' + body.image.data;
      var pk = kind === 'product' ? clip(body.productKey, 140) : '';
      if (kind === 'gallery') {
        if (state.photos.filter(function (p) { return p.kind === 'gallery'; }).length >= GALLERY_LIMIT) throw new Error('The gallery is full. Remove a photo first.');
      } else {
        state.photos = state.photos.filter(function (p) { return !(p.kind === kind && (kind !== 'product' || p.product_key === pk)); });
      }
      state.photos.push({ photo_id: id, kind: kind, product_key: pk });
      syncProductPhotos(state);
    } else if (action === 'delete_photo') {
      state.photos = state.photos.filter(function (p) { return p.photo_id !== body.photoId; });
      syncProductPhotos(state);
    } else if (action === 'answer_question') {
      var qk = clip(body.qKey, 200), ans = clip(body.answer, 600);
      var q = state.questions.find(function (x) { return x.q_key === qk; });
      if (q) { state.questions = state.questions.filter(function (x) { return x !== q; }); state.answeredQuestions.unshift(Object.assign({}, q, { answer: ans })); }
    } else if (action === 'dismiss_question') {
      state.questions = state.questions.filter(function (x) { return x.q_key !== clip(body.qKey, 200); });
    } else if (action === 'update_request') {
      var r = state.requests.find(function (x) { return x.request_id === body.requestId; });
      if (r) { if (body.status) r.status = body.status; if (body.reply !== undefined) r.reply = clip(body.reply, 600); r.updated_at = new Date().toISOString(); }
    } else if (action === 'delete_request' || action === 'delete_order') {
      state.requests = state.requests.filter(function (x) { return x.request_id !== body.requestId; });
      state.orders = state.orders.filter(function (x) { return x.request_id !== body.requestId; });
    } else if (action === 'save_order') {
      var code = clip(body.code, 40);
      if (!code) throw new Error('Please enter the bill or order number.');
      var o = state.orders.find(function (x) { return x.code === code; });
      if (o) { o.status = body.status; o.reply = clip(body.note, 300); }
      else state.orders.unshift({ request_id: 'o' + Date.now().toString(16) + Math.random().toString(16).slice(2, 10), kind: 'order', code: code, status: body.status, reply: clip(body.note, 300) });
    } else if (action === 'save_features') {
      Object.keys(body.features || {}).forEach(function (k) { if (typeof body.features[k] === 'boolean' && k in state.features) state.features[k] = body.features[k]; });
    } else if (action === 'set_bot_name') {
      state.facts.bot_name = clip(body.name, 40);
    } else if (action === 'save_info') {
      var info = body.info || {};
      Object.keys(INFO_KEYS).forEach(function (k) { if (typeof info[k] === 'string') state.facts[k] = clip(info[k], INFO_KEYS[k]); });
    } else if (action === 'plan_update') {
      var err = new Error('The AI helper is not available in the demo.');
      err.status = 501;
      throw err;
    } else if (action !== 'load') {
      throw new Error('Unknown action.');
    }
    return ownerView(state);
  }

  function json(body, status) {
    return new Response(JSON.stringify(body), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
  }

  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf(BASE) !== 0) return realFetch(input, init);
    var path = url.slice(BASE.length).split('?')[0];
    var query = new URLSearchParams(url.indexOf('?') === -1 ? '' : url.slice(url.indexOf('?') + 1));
    var body = {};
    try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        try {
          var state = load();
          if (path === '/api/botcraft/owner') {
            var view = handleOwner(state, body);
            save(state);
            resolve(json(view));
          } else if (path === '/api/botcraft/public') {
            if (query.get('s') !== PUBLIC_ID) { resolve(json({ ok: false, error: 'This shop\'s bot was not found.' }, 404)); return; }
            resolve(json(publicView(state)));
          } else if (path === '/api/botcraft/ask') {
            var answer = demoAnswer(state, body.text || '', body.product || '');
            if (answer === null) {
              var qk = nameKey(body.text || '').slice(0, 200);
              var existing = state.questions.find(function (x) { return x.q_key === qk; });
              if (existing) { existing.times += 1; existing.last_at = new Date().toISOString(); }
              else state.questions.unshift({ q_key: qk, question: clip(body.text, 300), product: '', times: 1, last_at: new Date().toISOString() });
              save(state);
              answer = 'I am not sure about that. Please ask the owner at the counter — I have noted your question for them.';
            }
            resolve(json({ ok: true, reply: answer, suggestions: ['What are your timings?', 'Show items & prices'] }));
          } else if (path === '/api/botcraft/request') {
            var id = Date.now().toString(16).padStart(12, '0') + Math.random().toString(16).slice(2).padEnd(20, '0').slice(0, 20);
            var req = { request_id: id, kind: body.kind, code: String(100 + state.requests.length + 1), message: clip(body.message, 600), pickup: clip(body.pickup, 80), customer_name: clip(body.name, 60), status: 'new', reply: '', created_at: new Date().toISOString(), photo_id: body.image && body.image.data ? 'data:' + body.image.mimeType + ';base64,' + body.image.data : '' };
            state.requests.unshift(req);
            save(state);
            resolve(json({ ok: true, request: { id: id, code: req.code } }));
          } else if (path === '/api/botcraft/requests') {
            var ids = Array.isArray(body.ids) ? body.ids : [];
            resolve(json({ ok: true, requests: state.requests.filter(function (r) { return ids.indexOf(r.request_id) !== -1; }).map(function (r) { return { id: r.request_id, kind: r.kind, code: r.code, message: r.message, pickup: r.pickup, status: r.status, reply: r.reply, updatedAt: r.updated_at || r.created_at }; }) }));
          } else if (path === '/api/botcraft/order') {
            var found = state.orders.find(function (o) { return o.code === String(query.get('code') || '').trim(); });
            resolve(json({ ok: true, order: found ? { code: found.code, status: found.status, note: found.reply, updatedAt: '' } : null }));
          } else if (path === '/api/botcraft/push') {
            resolve(json({ ok: false, error: 'Notifications are not available in the demo.' }, 501));
          } else {
            resolve(json({ ok: false, error: 'Not available in the demo.' }, 404));
          }
        } catch (error) {
          resolve(json({ ok: false, error: error.message || 'Something went wrong.' }, error.status || 400));
        }
      }, 120);
    });
  };

  window.BOTCRAFT_DEMO_RESET = function () { try { localStorage.removeItem(STATE_KEY); } catch (e) {} };

  // A small ribbon so nobody mistakes the demo for a real shop.
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.createElement('div');
    bar.className = 'demo-ribbon';
    bar.innerHTML = 'Demo mode — data stays in this browser, no AI key needed. <a href="' + (location.pathname.indexOf('/salesbot/') !== -1 ? '../chatbot-builder/demo.html' : './demo.html') + '">Demo home</a>';
    document.body.prepend(bar);
  });
})();
