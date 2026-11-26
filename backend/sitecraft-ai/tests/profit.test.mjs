// Abuse limits, owner credit records and the profit report, on a real SQLite database through a small stand-in for D1.
import { DatabaseSync } from 'node:sqlite';
import { profitOf, profitRates, profitReport, recordOwnerCredits, recordUsage, takeIpLimit } from '../botcraft-store.js';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };
function d1() {
  const sqlite = new DatabaseSync(':memory:');
  const statement = (sql, binds = []) => ({
    bind: (...values) => statement(sql, values),
    run: async () => { const r = sqlite.prepare(sql).run(...binds); return { meta: { changes: Number(r.changes) } }; },
    first: async () => sqlite.prepare(sql).get(...binds) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...binds) })
  });
  return { prepare: sql => statement(sql), batch: async list => { for (const item of list) await item.run(); return []; } };
}
const env = { BOTCRAFT_DB: d1() };
const rates = profitRates({});

// ---- limits per internet connection ----
const t0 = new Date('2026-11-26T10:00:00Z');
const results = []; for (let i = 0; i < 4; i++) results.push(await takeIpLimit(env, 'iphash1', 'new_shop', 3, t0));
ok('an address may start 3 assistants a day, the 4th is refused', results.join() === 'true,true,true,false', results.join());
ok('another address and another kind are counted separately', await takeIpLimit(env, 'iphash2', 'new_shop', 3, t0) && await takeIpLimit(env, 'iphash1', 'setup_msg', 3, t0));
ok('the next day starts afresh', await takeIpLimit(env, 'iphash1', 'new_shop', 3, new Date(t0.getTime() + 86400000)));
ok('a limit of 0 refuses everything', !(await takeIpLimit(env, 'iphash3', 'new_shop', 0, t0)));

// ---- the arithmetic ----
ok('default rates: $0.25 / $1.50 per 1M tokens, Rs 90 a dollar, Rs 0.20 a credit', rates.inRate === 0.25 && rates.outRate === 1.5 && rates.fx === 90 && rates.creditInr === 0.2);
const typical = profitOf(rates, { replies: 1000, customerCredits: 1000, inTokens: 5700 * 1000, outTokens: 200 * 1000 });
ok('1,000 typical replies cost about Rs 155 and are worth Rs 200 (+29%)', Math.abs(typical.costInr - 155.25) < 0.5 && typical.revenueInr === 200 && typical.marginInr > 44 && typical.marginPct > 22 && !typical.loss, JSON.stringify(typical));
const big = profitOf(rates, { replies: 1000, customerCredits: 1000, inTokens: 12000 * 1000, outTokens: 250 * 1000 });
ok('a big shop without trimming (12,000 tokens a reply) is a loss and says so', big.loss === true && big.marginInr < 0, JSON.stringify(big));
const voice = profitOf(rates, { replies: 100, voiceReplies: 100, customerCredits: 300, inTokens: 5700 * 100, outTokens: 200 * 100 });
ok('100 voice answers (3 credits each) stay profitable', !voice.loss && voice.marginInr > 0, JSON.stringify(voice));
const studio = profitOf(rates, { ownerCredits: 25, studioPhotos: 1 });
ok('a studio photo (25 credits = Rs 5) costs Rs 3.60 and keeps a margin', studio.costInr === 3.6 && studio.revenueInr === 5 && !studio.loss, JSON.stringify(studio));
ok('no credits used and no cost means no margin percentage and no loss', profitOf(rates, {}).marginPct === null && profitOf(rates, {}).loss === false);

// ---- recorded usage and the report ----
for (let i = 0; i < 10; i++) await recordUsage(env, 'shopGood', { inTokens: 5000, outTokens: 200, credits: 1 });
for (let i = 0; i < 10; i++) await recordUsage(env, 'shopBad', { inTokens: 40000, outTokens: 300, credits: 1 });
await recordUsage(env, 'shopGood', { inTokens: 6000, outTokens: 100, credits: 3, voice: true });
await recordOwnerCredits(env, 'shopGood', 'studio', 25, { countCall: true });
await recordOwnerCredits(env, 'shopGood', 'update', 1);
const report = await profitReport(env, null, new Date());
const good = report.shops.find(x => x.shopId === 'shopGood'), bad = report.shops.find(x => x.shopId === 'shopBad');
ok('the report lists each shop with credits, voice answers and studio photos', good.customerCredits === 13 && good.voiceReplies === 1 && good.studioPhotos === 1 && good.ownerCredits === 26 && good.replies === 11, JSON.stringify(good));
ok('a shop whose replies cost more than its credits is flagged and listed first', bad.loss === true && report.shops[0].shopId === 'shopBad', JSON.stringify(report.shops.map(x => [x.shopId, x.marginInr])));
ok('the total adds the shops up', Math.abs(report.total.costInr - (good.costInr + bad.costInr)) < 0.02 && report.total.customerCredits === 23);
const one = await profitReport(env, 'shopGood', new Date());
ok('a report for one shop has only that shop', one.shops.length === 1 && one.shops[0].shopId === 'shopGood');
const old = await profitReport(env, 'shopGood', new Date(Date.now() + 40 * 86400000));
ok('use older than 30 days is not in the report', old.shops.length === 0);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
