// The answer cache, run on a real SQLite database through a small stand-in for Cloudflare D1.
import { DatabaseSync } from 'node:sqlite';
import { CACHE_MAX_PER_SHOP, cacheStats, getCachedAnswer, normalizeQuestion, saveCachedAnswer, sha256Hex } from '../botcraft-store.js';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };

function d1() {
  const sqlite = new DatabaseSync(':memory:');
  const statement = (sql, binds = []) => ({
    bind: (...values) => statement(sql, values),
    run: async () => { const r = sqlite.prepare(sql).run(...binds); return { meta: { changes: Number(r.changes) } }; },
    first: async () => sqlite.prepare(sql).get(...binds) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...binds) }),
    sql, binds
  });
  return { prepare: sql => statement(sql), batch: async list => { for (const item of list) await item.run(); return []; } };
}
const env = { BOTCRAFT_DB: d1() };

ok('questions are matched ignoring case, punctuation and spaces', normalizeQuestion('  What are  your TIMINGS??  ') === 'what are your timings' && normalizeQuestion('ఈ ఫ్రిడ్జ్ ధర ఎంత?') === 'ఈ ఫ్రిడ్జ్ ధర ఎంత');
const key = await sha256Hex('PROMPT v1\n' + normalizeQuestion('What are your timings?'));
ok('the key is a SHA-256 hash and changes with the prompt or the question', key.length === 64 && key !== await sha256Hex('PROMPT v2\n' + normalizeQuestion('What are your timings?')) && key !== await sha256Hex('PROMPT v1\n' + normalizeQuestion('What are your offers?')));

const t0 = new Date('2026-11-25T10:00:00Z');
ok('nothing is saved yet', await getCachedAnswer(env, 'shopA', key, t0) === null);
await saveCachedAnswer(env, 'shopA', key, { reply: 'We are open 10 AM to 9 PM.', suggestions: ['Any offers?', 'Where is the shop?', 'Phone number?', 'a fourth one'] }, t0);
const hit = await getCachedAnswer(env, 'shopA', key, new Date(t0.getTime() + 3600000));
ok('the saved answer comes back with at most 3 suggestions', hit && hit.reply.startsWith('We are open') && hit.suggestions.length === 3, JSON.stringify(hit));
ok('another shop never sees it', await getCachedAnswer(env, 'shopB', key, t0) === null);
ok('a changed prompt (the shop changed) does not find the old answer', await getCachedAnswer(env, 'shopA', await sha256Hex('PROMPT v2\nwhat are your timings'), t0) === null);
await getCachedAnswer(env, 'shopA', key, t0);
ok('hits are counted', (await cacheStats(env, 'shopA')).hits === 2 && (await cacheStats(env, 'shopA')).saved === 1);
ok('after 30 days an answer is not reused', await getCachedAnswer(env, 'shopA', key, new Date(t0.getTime() + 31 * 86400000)) === null);
await saveCachedAnswer(env, 'shopA', key, { reply: 'New answer.' }, new Date(t0.getTime() + 32 * 86400000));
ok('saving again replaces the answer (fresh for another 30 days)', (await getCachedAnswer(env, 'shopA', key, new Date(t0.getTime() + 33 * 86400000)))?.reply === 'New answer.');

for (let i = 0; i < CACHE_MAX_PER_SHOP + 20; i++) await saveCachedAnswer(env, 'shopC', `key${i}`, { reply: `answer ${i}` }, new Date(t0.getTime() + i * 1000));
const stats = await cacheStats(env, 'shopC');
ok(`a shop keeps at most ${CACHE_MAX_PER_SHOP} answers, the newest`, stats.saved === CACHE_MAX_PER_SHOP && await getCachedAnswer(env, 'shopC', 'key0', new Date(t0.getTime() + 400000)) === null && (await getCachedAnswer(env, 'shopC', `key${CACHE_MAX_PER_SHOP + 19}`, new Date(t0.getTime() + 400000)))?.reply === `answer ${CACHE_MAX_PER_SHOP + 19}`, JSON.stringify(stats));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
