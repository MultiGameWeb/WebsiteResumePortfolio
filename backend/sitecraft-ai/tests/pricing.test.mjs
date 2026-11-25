// The packages and recharge packs must add up: plan price = build price + included replies at Rs 0.20,
// and Rs 0.20 must stay at least our cost + 28% (cost Rs 0.155 per reply).
import { PACKS, PLANS, REPLY_COST_RUPEES } from '../botcraft-packs.js';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };
ok('three build packages with the agreed prices', PLANS.map(p => p.price).join() === '1099,1699,2299' && PLANS.map(p => p.basePrice).join() === '999,1499,1999');
ok('plan price = build price + included replies at Rs 0.20', PLANS.every(p => p.price - p.basePrice === p.replies * 0.2), JSON.stringify(PLANS));
ok('the included replies are paid for with at least cost + 28%', PLANS.every(p => (p.price - p.basePrice) >= p.replies * REPLY_COST_RUPEES * 1.28));
ok('three recharge packs 5K, 10K, 25K at 1010, 2020, 5040', PACKS.map(p => `${p.replies}:${p.price}`).join() === '5000:1010,10000:2020,25000:5040');
ok('each pack is at least cost + 30%', PACKS.every(p => p.price >= p.replies * REPLY_COST_RUPEES * 1.3));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
