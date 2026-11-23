// Checks for the setup chat rules: values must be backed by the owner's words, the bot must not say it is finished while questions are open,
// a photo button comes with its question, and an optional photo never holds the shop questions back.
// Run with: node backend/sitecraft-ai/tests/setup-flow.mjs
import { evidenceFound, ownerCorpus, valueAccepted, guardSetupReply, notApplicableQuestions, nextStep, pendingCore, shopFeatures } from '../botcraft-builder.js';
import { SHOP_TYPES } from '../botcraft-shop-types.js';
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
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
