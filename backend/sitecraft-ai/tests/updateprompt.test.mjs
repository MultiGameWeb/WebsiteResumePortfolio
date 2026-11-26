// The update helper's prompt: every item stays, saved answers are cut to the ones related to what the owner wrote.
import { MAX_PLAN_ANSWERS, buildPlanPrompt, cleanPlan, relevantAnswers } from '../botcraft-owner-update.js';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };
const answers = Array.from({ length: 120 }, (_, i) => ({ id: `a:${i}`, question: `Do you offer service number ${i}?`, answer: i === 77 ? 'Free delivery within 10 km on bills above 10000.' : 'Yes, available with 1 year warranty and a bill.', hidden: false }));
const products = Array.from({ length: 200 }, (_, i) => ({ name: `Brand${i} Model ${i} Smart Phone`, name_key: `brand${i}`, price_text: `₹${10000 + i}`, stock_status: 'in_stock' }));
const base = buildPlanPrompt(products, {}, 0, [], '');
const allAnswerChars = answers.map(a => `- [${a.id}] ${a.question} → ${a.answer}`).join('\n').length;
const withText = buildPlanPrompt(products, {}, 0, answers, 'change the delivery policy to free delivery within 15 km');
ok(`only ${MAX_PLAN_ANSWERS} saved answers are sent, which is less than 40% of all answer text`, (withText.match(/\[a:\d+\]/g) || []).length <= MAX_PLAN_ANSWERS && withText.length - base.length < allAnswerChars * 0.4, `${withText.length - base.length} of ${allAnswerChars} answer characters`);
ok('the answer the owner means (delivery) is among them', withText.includes('[a:77]'));
ok('every item is still listed', products.every(p => withText.includes(p.name)));
ok('the prompt says there are more answers', /most related to this message, there are more/.test(withText));
const none = relevantAnswers(answers, 'xyzzy');
ok('with nothing related a few answers are still sent', none.length === 8 && none[0].id === 'a:0');
ok('a shop with few answers sends all of them', relevantAnswers(answers.slice(0, 20), 'anything').length === 20);
ok('a plan may still change any saved answer (ids are checked against all of them)', cleanPlan({ summary: 's', ops: [{ type: 'delete_answer', answer_id: 'a:5' }] }, products, 0, answers).ops.length === 1);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
