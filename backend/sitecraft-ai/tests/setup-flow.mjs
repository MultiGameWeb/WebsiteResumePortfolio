// Checks for the setup chat rules: values must be backed by the owner's words, the bot must not say it is finished while questions are open,
// a photo button comes with its question, and an optional photo never holds the shop questions back.
// Run with: node backend/sitecraft-ai/tests/setup-flow.mjs
import { evidenceFound, ownerCorpus, valueAccepted, guardSetupReply, notApplicableQuestions, nextStep, pendingCore, shopFeatures, customerImages, withCustomerImages } from '../botcraft-builder.js';
import { SHOP_TYPES } from '../botcraft-shop-types.js';
import { customerAudio, withCustomerAudio, speakReply, VOICE_SCHEMA, AUDIO_RULE } from '../botcraft-speech.js';
import { SALESBOT_SCHEMA } from '../botcraft-salesbot.js';
import { CORE_QUESTIONS } from '../botcraft-question-bank.js';
import { QUESTION_BANKS } from '../botcraft-banks/index.js';
let pass = 0, fail = 0; const ok = (name, cond, extra='') => { cond ? pass++ : fail++; console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (cond ? '' : '  -> ' + extra)); };
const said = 'Shop name: Sri Balaji Electronics, Address: Shop 14, Main Road, Kukatpally, Hyderabad. EMI: Yes on some items, bills above Rs 10,000. Timings: 10:00 AM to 9:00 PM';
const corpus = ownerCorpus([said]);
ok('exact words from the owner are accepted', evidenceFound('EMI: Yes on some items, bills above Rs 10,000', corpus));
ok('capital letters and punctuation do not matter', evidenceFound('timings 10 00 am to 9 00 pm', corpus));
ok('a summary the owner never said is rejected', !evidenceFound('The shop offers EMI on all electronics above 13K and free delivery', corpus));
ok('an empty evidence is rejected', !evidenceFound('', corpus));
ok('a short quote that is not in the text is rejected', !evidenceFound('free parking', corpus));
ok('a long quote with one copying slip is accepted', evidenceFound('Shop name Sri Balaji Electronics Address Shop 14 Main Road Kukatpally Hyderabad EMI Yes', corpus));
ok('a long made-up quote is rejected', !evidenceFound('we sell premium mobiles laptops fridges and televisions with free home delivery and installation', corpus));
ok('"not applicable" needs no evidence', valueAccepted({ value: 'Not applicable', evidence: '', corpus }));
ok('a value read from a photo needs no evidence', valueAccepted({ value: 'Rs 17,999', evidence: '', corpus, fromPhoto: true }));
ok('a value with no evidence is rejected', !valueAccepted({ value: 'Yes', evidence: '', corpus }));
ok('a value with false evidence is rejected', !valueAccepted({ value: 'Yes', evidence: 'we have free parking for cars', corpus }));

// the reply guard
const claim = 'Thank you, Ravi! Your shop assistant is now fully ready. You can find your link and QR code on the dashboard.';
let g = guardSetupReply(claim, { left: 38, formCount: 8 }); ok('"fully ready" is replaced while 38 questions are open (with a form)', !/ready/i.test(g) && /38 important questions are still open/.test(g), g);
g = guardSetupReply(claim, { left: 38, formCount: 0, photoQuestion: 'Please send a photo of your shop front or signboard.' }); ok('"fully ready" is replaced and the photo question is added', !/fully ready/i.test(g) && g.includes('Please send a photo of your shop front'), g);
g = guardSetupReply('Please send your photo.', { left: 5, formCount: 0, photoQuestion: 'Would you like to add a photo of yourself (the owner)?' }); ok('a photo button always comes with its question', g.includes('Would you like to add a photo of yourself'), g);
g = guardSetupReply('Please send a photo of your shop front or signboard.', { left: 5, formCount: 0, photoQuestion: 'Please send a photo of your shop front or signboard.' }); ok('the photo question is not repeated if the reply already has it', g.split('Please send a photo of your shop front').length === 2, g);
g = guardSetupReply(claim, { left: 38, formCount: 8, finishing: true }); ok('after "Finish for now" the reply is left alone', g === claim);
g = guardSetupReply(claim, { left: 0, formCount: 0 }); ok('when nothing is open the reply is left alone', g === claim);
g = guardSetupReply('Please answer these:', { left: 12, formCount: 6 }); ok('a normal "Please answer these:" is left alone', g === 'Please answer these:');

// the order of the steps: an optional photo must not hold the shop questions back
const bank = QUESTION_BANKS.appliances_showroom;
const core = {}; for (const q of CORE_QUESTIONS) if (q.answer_type !== 'image') core[q.key] = 'Yes';
core.shop_type = 'appliances_showroom'; core.shop_name = 'Sri Balaji Electronics';
let step = nextStep({ ...core, shop_front_photo: 'photo received' }, {}, bank);
ok('shop front photo done, owner photo still missing -> the shop questions come next (not the photo)', step.form.length > 0 && !step.photo, JSON.stringify(Object.keys(step)));
step = nextStep({ ...core }, {}, bank); ok('shop front photo (required) missing -> the photo is asked first', Boolean(step.photo) && step.photo.key === 'shop_front_photo', JSON.stringify(step.photo?.key));
const all = {}; bank.questions.forEach(q => { all[q.id] = 'x'; });
step = nextStep({ ...core, shop_front_photo: 'photo received' }, all, bank); ok('all shop questions done -> then the optional owner photo is asked', Boolean(step.photo) && step.photo.key === 'owner_photo', JSON.stringify(step.photo?.key));
step = nextStep({ ...core, shop_front_photo: 'photo received', owner_photo: 'skipped' }, all, bank); ok('everything done -> nothing more to ask', step.form.length === 0 && !step.photo);

const answers = { [bank.questions[0].id]: 'Not applicable', [bank.questions[1].id]: 'Yes' };
ok('questions marked "not applicable" are listed for the owner', notApplicableQuestions(bank, answers).length === 1 && notApplicableQuestions(bank, answers)[0] === bank.questions[0].owner_question);
// The electronics store list (mobiles, laptops, TVs, fridges, accessories in one shop)
const eb = QUESTION_BANKS.electronics_store;
ok('electronics store: a ready question list exists for the shop type', Boolean(eb) && SHOP_TYPES.some(t => t.key === 'electronics_store'));
ok('electronics store: list is large and ordered mandatory, important, optional', eb.questions.length >= 150 && eb.questions.every((q, i, a) => i === 0 || ({ mandatory: 0, important: 1, optional: 2 }[q.priority] >= { mandatory: 0, important: 1, optional: 2 }[a[i - 1].priority])));
const topics = { 'phone brands': /phone brands/i, 'laptop brands': /laptop .*brands/i, 'TV sizes': /TV sizes/i, 'fridge types': /refrigerator types/i, 'accessories': /accessories/i, '5G / eSIM': /5G/i, 'Windows / Office': /Windows/i, 'compatible accessories': /fits their phone or laptop/i, 'screen / battery replacement': /screens and batteries/i, 'buyback': /buy old phones/i, 'exchange': /exchange/i, 'delivery': /deliver/i, 'installation': /install/i, 'warranty': /warranty/i, 'refurbished': /refurbished/i, 'EMI / finance': /EMI/i };
for (const [name, re] of Object.entries(topics)) ok(`electronics store list covers: ${name}`, eb.questions.some(q => re.test(q.owner_question)));
ok('electronics store: the products question offers phones, laptops and accessories', (eb.questions[0].options || []).some(o => /Mobile phones/.test(o)) && eb.questions[0].options.some(o => /Laptops/.test(o)));
ok('electronics store: the EMI basics are asked (not marked not applicable)', pendingCore({ shop_type: 'electronics_store' }).some(q => q.key === 'emi'));
ok('electronics store: no question is repeated', new Set(eb.questions.map(q => q.owner_question)).size === eb.questions.length);
// "Send a photo" on the customer page
ok('send a photo is off by default for an electronics store', shopFeatures('electronics_store', {}).photo === false);
ok('send a photo is off by default for an appliances showroom', shopFeatures('appliances_showroom', {}).photo === false);
ok('send a photo stays on by default for a pharmacy and a jewellery shop', shopFeatures('pharmacy', {}).photo === true && shopFeatures('jewellery', {}).photo === true);
ok('the owner can turn it on for an electronics store', shopFeatures('electronics_store', { features: { photo: true } }).photo === true);
ok('the owner can turn it off for a pharmacy', shopFeatures('pharmacy', { features: { photo: false } }).photo === false);
// Photos a customer sends in the chat
const okImg = { mimeType: 'image/jpeg', data: 'QUJD' };
ok('customer photos: a good photo is kept', customerImages([okImg]).length === 1);
ok('customer photos: at most 3', customerImages([okImg, okImg, okImg, okImg, okImg]).length === 3);
ok('customer photos: only jpeg, png and webp', customerImages([{ mimeType: 'application/pdf', data: 'QUJD' }, { mimeType: 'image/svg+xml', data: 'QUJD' }, { mimeType: 'text/html', data: 'QUJD' }]).length === 0);
ok('customer photos: a huge photo is refused', customerImages([{ mimeType: 'image/png', data: 'A'.repeat(1_900_000) }]).length === 0);
ok('customer photos: data that is not base64 is refused', customerImages([{ mimeType: 'image/png', data: 'not base64 <script>' }]).length === 0);
ok('customer photos: nothing sent -> nothing kept', customerImages(undefined).length === 0 && customerImages('x').length === 0);
ok('customer photos: extra fields are dropped', Object.keys(customerImages([{ ...okImg, evil: 'x' }])[0]).join() === 'mimeType,data');
const msgs = [{ role: 'user', parts: [{ text: 'hello' }] }, { role: 'model', parts: [{ text: 'hi' }] }, { role: 'user', parts: [{ text: 'do you have this?' }] }];
const withImg = withCustomerImages(msgs, [okImg]);
ok('customer photos: added to the last customer message only', withImg[2].parts.length === 2 && withImg[2].parts[1].inlineData.mimeType === 'image/jpeg' && withImg[0].parts.length === 1 && withImg[1].parts.length === 1);
ok('customer photos: the original messages are not changed', msgs[2].parts.length === 1);
ok('customer photos: no photos -> messages as they were', withCustomerImages(msgs, []) === msgs);
// Voice to voice (customer speaks, the answer comes back as a voice)
const wavBase64 = Buffer.from('RIFF0000WAVEfmt ').toString('base64');
ok('voice: a WAV recording is accepted', customerAudio({ mimeType: 'audio/wav', data: wavBase64 })?.mimeType === 'audio/wav');
ok('voice: the mime type may carry a codec note', Boolean(customerAudio({ mimeType: 'audio/wav; codecs=1', data: wavBase64 })));
ok('voice: other sound types are refused', customerAudio({ mimeType: 'audio/webm', data: wavBase64 }) === null && customerAudio({ mimeType: 'text/html', data: wavBase64 }) === null);
ok('voice: a huge recording is refused', customerAudio({ mimeType: 'audio/wav', data: 'A'.repeat(2_100_000) }) === null);
ok('voice: data that is not base64 is refused', customerAudio({ mimeType: 'audio/wav', data: '<script>' }) === null && customerAudio({ mimeType: 'audio/wav' }) === null && customerAudio(undefined) === null);
const spoken = withCustomerAudio(msgs, { mimeType: 'audio/wav', data: wavBase64 });
ok('voice: the recording is added to the last customer message only', spoken[2].parts.length === 2 && spoken[2].parts[1].inlineData.mimeType === 'audio/wav' && spoken[0].parts.length === 1 && msgs[2].parts.length === 1);
ok('voice: the answer format also asks what the customer said', VOICE_SCHEMA.required[0] === 'heard' && VOICE_SCHEMA.properties.heard && VOICE_SCHEMA.properties.reply && SALESBOT_SCHEMA.properties.heard === undefined);
ok('voice: the instructions say not to guess when there is no clear speech', /no clear speech/.test(AUDIO_RULE));
// the spoken answer, with the speech services stubbed
const pcm = Buffer.alloc(4800).toString('base64');
const realFetch = globalThis.fetch; let calls = [];
globalThis.fetch = async (url, init) => { calls.push(String(url)); if (/sarvam/.test(url)) return new Response(JSON.stringify({ audios: [Buffer.from(Uint8Array.from([82,73,70,70,36,0,0,0,87,65,86,69,102,109,116,32,16,0,0,0,1,0,1,0,128,187,0,0,0,119,1,0,2,0,16,0,100,97,116,97,0,0,0,0])).toString('base64')] }), { status: 200 }); return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: pcm } }] } }] }), { status: 200 }); };
let audio = await speakReply({ BOTCRAFT_GEMINI_API_KEY: 'k' }, 'We are open from 10 AM to 9 PM.');
ok('voice: the answer comes back as a WAV voice (Gemini speech)', audio?.mimeType === 'audio/wav' && Buffer.from(audio.data, 'base64').subarray(0, 4).toString() === 'RIFF' && calls.some(u => /generativelanguage/.test(u)), JSON.stringify(calls));
calls = []; audio = await speakReply({ BOTCRAFT_GEMINI_API_KEY: 'k', SARVAM_API_KEY: 's' }, 'మేము ఉదయం 10 నుండి రాత్రి 9 వరకు తెరిచి ఉంటాము.');
ok('voice: a Telugu answer uses the Indian-language voice when its key is set', calls.some(u => /sarvam/.test(u)) && audio?.mimeType === 'audio/wav', JSON.stringify(calls));
calls = []; await speakReply({ BOTCRAFT_GEMINI_API_KEY: 'k', SARVAM_API_KEY: 's' }, 'We are open from 10 AM.');
ok('voice: an English answer uses the Gemini voice', calls.length === 1 && /generativelanguage/.test(calls[0]), JSON.stringify(calls));
calls = []; ok('voice: switched off with BOTCRAFT_VOICE_REPLY=off', (await speakReply({ BOTCRAFT_GEMINI_API_KEY: 'k', BOTCRAFT_VOICE_REPLY: 'off' }, 'Hello there')) === null && calls.length === 0);
ok('voice: no key at all -> no sound (the page reads the text instead)', (await speakReply({}, 'Hello there')) === null);
globalThis.fetch = async () => new Response('boom', { status: 500 });
const quiet = console.error; console.error = () => {};
ok('voice: a failing speech service gives no sound, not an error', (await speakReply({ BOTCRAFT_GEMINI_API_KEY: 'k' }, 'Hello there')) === null);
console.error = quiet; globalThis.fetch = realFetch;
ok('voice: markdown and links are not read out', await (async () => { let sent = ''; globalThis.fetch = async (u, init) => { sent = init.body; return new Response('x', { status: 500 }); }; console.error = () => {}; await speakReply({ BOTCRAFT_GEMINI_API_KEY: 'k' }, '**Hello** see https://example.com now 😀'); console.error = quiet; globalThis.fetch = realFetch; return !/\*\*|https:|😀/.test(sent) && /Hello/.test(sent); })());
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
