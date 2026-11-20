import { CORE_QUESTIONS } from "./botcraft-question-bank.js";
import { EXTRA_ID, extraQuestions } from "./botcraft-salesbot.js";

// The answers the owner gave in the setup chat (offers, policies, delivery,
// extra questions, notes) are what the customer bot tells customers. This
// module lists them with a stable id each, so the owner can edit, hide or
// delete one from the owner page or by chat or voice.
//
// Ids: f:<key> core fact, a:<questionId> bank answer, x:<extra_n> extra
// question, n:<index> note, o:<qKey> a customer question the owner answered.
// Hiding stores the id in the shop settings (hiddenAnswers); a hidden answer
// stays saved but customers and the bot never see it.

// Shop information that has its own fields on the owner page (and its own chat commands).
const OTHER_FIELDS = new Set(["shop_name", "owner_name", "owner_photo", "shop_front_photo", "timings", "weekly_holiday", "address", "call_number", "whatsapp_number", "map_link", "about", "bot_name", "shop_type", "shop_wifi", "wifi_name", "wifi_password"]);
const EMPTY = /^(skipped|not applicable|photo received|)$/i;
const usable = value => !EMPTY.test(String(value ?? "").trim());
const MAX_HIDDEN = 300;
export const noteHideId = (note, index) => `n:${index}:${String(note).slice(0, 40)}`;

export function answerList(shop, bank, ownerAnswers, hiddenIds) {
  const hidden = new Set(hiddenIds || []);
  const out = [];
  const add = (id, question, answer) => out.push({ id, question: String(question), answer: String(answer), hidden: hidden.has(id) });
  for (const q of CORE_QUESTIONS) {
    if (OTHER_FIELDS.has(q.key) || out.some(item => item.id === `f:${q.key}`)) continue;
    const value = shop.facts?.[q.key];
    if (usable(value)) add(`f:${q.key}`, q.customer_question, value);
  }
  for (const q of bank?.questions || []) {
    const value = shop.answers?.[q.id];
    if (usable(value)) add(`a:${q.id}`, q.customer_question || q.owner_question, value);
  }
  for (const extra of extraQuestions(shop.answers)) if (usable(extra.a)) add(`x:${extra.id}`, extra.q, extra.a);
  (shop.notes || []).forEach((note, index) => { if (usable(note)) add(noteHideId(note, index), "Other shop information", note); });
  for (const item of ownerAnswers || []) if (usable(item.answer)) add(`o:${item.q_key}`, item.question, item.answer);
  return out;
}

// A copy of the shop for customers: hidden answers removed.
export function withoutHidden(shop, hiddenIds) {
  const hidden = new Set(hiddenIds || []);
  if (!hidden.size) return shop;
  const facts = { ...shop.facts };
  for (const key of Object.keys(facts)) if (hidden.has(`f:${key}`)) delete facts[key];
  const answers = {};
  for (const [id, value] of Object.entries(shop.answers || {})) {
    if (hidden.has(EXTRA_ID.test(id) ? `x:${id}` : `a:${id}`)) continue;
    answers[id] = value;
  }
  return {
    ...shop,
    facts,
    answers,
    notes: (shop.notes || []).filter((note, index) => !hidden.has(noteHideId(note, index))),
    ownerAnswers: (shop.ownerAnswers || []).filter(item => !hidden.has(`o:${item.q_key}`))
  };
}

export const ANSWER_ID = /^(f:[a-z_0-9]{1,60}|a:[A-Za-z0-9_.-]{1,80}|x:extra_[1-3]|n:\d{1,3}:[\s\S]{0,40}|o:.{1,200})$/;

export function nextHidden(current, id, hide) {
  const set = new Set(current || []);
  if (hide) set.add(id); else set.delete(id);
  return [...set].slice(-MAX_HIDDEN);
}
