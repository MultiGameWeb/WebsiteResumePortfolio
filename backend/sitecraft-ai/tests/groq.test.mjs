// The optional Groq provider: when it is used, how it is called, and that every problem is reported so Gemini can take over.
import { callGroq, groqEligible, groqMode, looksEnglish, toChatMessages } from '../botcraft-groq.js';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };

ok('off by default, even with a key', groqMode({ GROQ_API_KEY: 'k' }) === 'off' && groqMode({ GROQ_API_KEY: 'k', BOTCRAFT_GROQ_MODE: 'off' }) === 'off');
ok('off without a key, even when the mode is on', groqMode({ BOTCRAFT_GROQ_MODE: 'text' }) === 'off');
ok('english and text modes need the key', groqMode({ GROQ_API_KEY: 'k', BOTCRAFT_GROQ_MODE: 'english' }) === 'english' && groqMode({ GROQ_API_KEY: 'k', BOTCRAFT_GROQ_MODE: 'TEXT' }) === 'text');

for (const q of ['What is the price of the LG 32 inch TV?', 'Do you have any offers today', 'Is the iPhone 15 available in stock?', 'Can you tell me the warranty on this fridge']) ok(`English: "${q}"`, looksEnglish(q));
for (const q of ['iPhone 15 price entha?', 'LG TV ela undi', 'mobile kitna hai', 'ఈ ఫ్రిడ్జ్ ధర ఎంత?', 'फ्रिज की कीमत क्या है', 'price', 'ok thanks']) ok(`not treated as English: "${q}"`, !looksEnglish(q));

const on = { GROQ_API_KEY: 'k', BOTCRAFT_GROQ_MODE: 'english' };
ok('english mode: an English text question may go to Groq', groqEligible(on, { question: 'What are the offers on laptops today?' }));
ok('english mode: a Telugu or Tenglish question stays with Gemini', !groqEligible(on, { question: 'laptop offers enti?' }) && !groqEligible(on, { question: 'ఆఫర్లు ఏమిటి' }));
ok('text mode: any text question may go to Groq', groqEligible({ ...on, BOTCRAFT_GROQ_MODE: 'text' }, { question: 'laptop offers enti?' }));
ok('photos, files and voice always stay with Gemini', ['photos', 'files'].every(k => !groqEligible({ ...on, BOTCRAFT_GROQ_MODE: 'text' }, { question: 'What is this item and the price?', [k]: 1 })) && !groqEligible({ ...on, BOTCRAFT_GROQ_MODE: 'text' }, { question: 'What is the price of this?', voice: true }));
ok('nothing goes to Groq when it is off', !groqEligible({ GROQ_API_KEY: 'k' }, { question: 'What is the price of the TV?' }));

const messages = toChatMessages('SYS', [{ role: 'user', parts: [{ text: 'hi' }] }, { role: 'model', parts: [{ text: 'hello' }] }, { role: 'user', parts: [{ text: 'price?' }, { inlineData: { mimeType: 'image/png', data: 'x' } }] }]);
ok('conversation is converted to chat messages (images are ignored)', messages.map(m => m.role).join() === 'system,user,assistant,user' && messages[3].content === 'price?');

const realFetch = globalThis.fetch;
const stub = (impl) => { globalThis.fetch = async (url, init) => impl(url, JSON.parse(init.body), init); };
let seen;
stub((url, body, init) => { seen = { url, body, auth: init.headers.Authorization }; return new Response(JSON.stringify({ choices: [{ message: { content: '{"reply":"The TV is ₹17,990.","suggestions":["Any offers?","Warranty?","x","y"],"answered":true}' } }], usage: { prompt_tokens: 5000, completion_tokens: 80 } }), { status: 200 }); });
let r = await callGroq({ GROQ_API_KEY: 'secret' }, { system: 'S', contents: [{ role: 'user', parts: [{ text: 'price?' }] }] });
ok('a good answer is returned with token counts (suggestions cut to 3)', r.result.reply.startsWith('The TV') && r.result.suggestions.length === 3 && r.usage.promptTokenCount === 5000 && r.usage.candidatesTokenCount === 80);
ok('the request goes to Groq with the key, JSON mode and low reasoning for gpt-oss', seen.url.includes('api.groq.com') && seen.auth === 'Bearer secret' && seen.body.response_format.type === 'json_object' && seen.body.reasoning_effort === 'low' && seen.body.model === 'openai/gpt-oss-120b' && /JSON object only/.test(seen.body.messages[0].content));
await callGroq({ GROQ_API_KEY: 'k', GROQ_MODEL: 'llama-3.3-70b-versatile' }, { system: 'S', contents: [] });
ok('another model can be chosen and gets no reasoning setting', seen.body.model === 'llama-3.3-70b-versatile' && seen.body.reasoning_effort === undefined);

const fails = { 'HTTP 429': () => new Response('{}', { status: 429 }), 'HTTP 500': () => new Response('{}', { status: 500 }), 'empty content': () => new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }), { status: 200 }), 'not JSON': () => new Response(JSON.stringify({ choices: [{ message: { content: 'hello there' } }] }), { status: 200 }), 'no reply field': () => new Response(JSON.stringify({ choices: [{ message: { content: '{"suggestions":[]}' } }] }), { status: 200 }), 'blank reply': () => new Response(JSON.stringify({ choices: [{ message: { content: '{"reply":"  "}' } }] }), { status: 200 }) };
for (const [name, make] of Object.entries(fails)) {
  stub(make);
  let threw = false; try { await callGroq({ GROQ_API_KEY: 'k' }, { system: 'S', contents: [] }); } catch { threw = true; }
  ok(`${name} is reported as an error, so Gemini takes over`, threw);
}
globalThis.fetch = (url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
let timedOut = false; try { await callGroq({ GROQ_API_KEY: 'k' }, { system: 'S', contents: [], timeoutMs: 50 }); } catch { timedOut = true; }
ok('a Groq call that hangs is cut off', timedOut);
globalThis.fetch = realFetch;
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
