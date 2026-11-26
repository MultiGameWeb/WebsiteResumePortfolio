// A finished bot puts its page live once, unless that is switched off or payment is required first.
import { autoPublishPage, publishNeedsPayment } from '../botcraft-builder.js';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };
const request = new Request('https://worker.example/api/botcraft/chat');
function fakes({ published = { ok: true, slug: 'sri-balaji', url: 'https://sri-balaji.example/' }, start = {} } = {}) {
  const state = { settings: { ...start }, publishCalls: [], saves: [] };
  return {
    state,
    deps: {
      loadSettings: async () => ({ ...state.settings }),
      saveSettings: async (env, id, patch) => { state.saves.push(patch); state.settings = { ...state.settings, ...patch }; },
      ensurePublicId: async () => 'abc123',
      publish: async (env, req, url, args) => { state.publishCalls.push(args); return published; }
    }
  };
}
const facts = { shop_name: 'Sri Balaji Electronics', about: 'We sell electronics.' };

let f = fakes();
let r = await autoPublishPage({}, request, 'shop1', facts, f.deps);
ok('a finished bot gets its page live and the address is saved', r?.url === 'https://sri-balaji.example/' && f.state.settings.pageSlug === 'sri-balaji');
ok('the page is made for the shop (public id, name, description, a free address)', f.state.publishCalls[0].publicId === 'abc123' && f.state.publishCalls[0].shopName === 'Sri Balaji Electronics' && f.state.publishCalls[0].existingSlug === '' && f.state.publishCalls[0].requestedSlug === '');
r = await autoPublishPage({}, request, 'shop1', facts, f.deps);
ok('it happens only once: a bot with a page is not published again', r === null && f.state.publishCalls.length === 1);

f = fakes({ published: { ok: false, status: 502, error: 'Could not load the page.' } });
r = await autoPublishPage({}, request, 'shop2', facts, f.deps);
ok('a failed publish returns nothing, and is not retried on every message', r === null && f.state.settings.pageAutoTried === true && !f.state.settings.pageSlug);
await autoPublishPage({}, request, 'shop2', facts, f.deps);
ok('no second try after a failure (the owner can publish from Manage my bot)', f.state.publishCalls.length === 1);

f = fakes();
r = await autoPublishPage({ BOTCRAFT_AUTO_PUBLISH: 'false' }, request, 'shop3', facts, f.deps);
ok('BOTCRAFT_AUTO_PUBLISH=false switches it off', r === null && f.state.publishCalls.length === 0 && f.state.saves.length === 0);
r = await autoPublishPage({ HOSTING_REQUIRE_PAYMENT: 'true' }, request, 'shop3', facts, f.deps);
ok('when payment is required, nothing is published here', r === null && f.state.publishCalls.length === 0);
r = await autoPublishPage({ HOSTING_DISABLED: 'true' }, request, 'shop3', facts, f.deps);
ok('when hosting is switched off, nothing is published', r === null && f.state.publishCalls.length === 0);
f = fakes({ start: { pageSlug: 'already-live' } });
r = await autoPublishPage({}, request, 'shop4', facts, f.deps);
ok('a shop that published by hand is left alone', r === null && f.state.publishCalls.length === 0);
f = fakes();
r = await autoPublishPage({ BOTCRAFT_REQUIRE_PAID: 'true' }, request, 'shop5', facts, f.deps);
ok('launch mode (BOTCRAFT_REQUIRE_PAID): an unpaid shop is not published, and no try is used up', r === null && f.state.publishCalls.length === 0 && !f.state.settings.pageAutoTried);
f = fakes({ start: { paid: true } });
r = await autoPublishPage({ BOTCRAFT_REQUIRE_PAID: 'true' }, request, 'shop6', facts, f.deps);
ok('launch mode: a paid shop is published', r?.url === 'https://sri-balaji.example/');
ok('the payment rule says what it should', publishNeedsPayment({ BOTCRAFT_REQUIRE_PAID: 'true' }, {}) && !publishNeedsPayment({ BOTCRAFT_REQUIRE_PAID: 'true' }, { paid: true }) && !publishNeedsPayment({}, {}) && !publishNeedsPayment({ BOTCRAFT_REQUIRE_PAID: 'false' }, {}));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
