// AI reply recharge packs (rupees). Price = our Gemini cost x 1.30, rounded up to the next Rs 10.
// The cost basis is Rs 0.155 for one reply of a typical shop (about 5,700 tokens in, 200 out on gemini-3.1-flash-lite at
// $0.25 / $1.50 per 1M tokens, Rs 90 to the dollar). It is an estimate: check it against the token log after real use
// (admin bot panel) and change the prices here, in one place. See docs/BOTCRAFT_PRICING.md.
export const REPLY_COST_RUPEES = 0.155;
export const PACK_MARGIN = 1.3;
const priceOf = replies => Math.ceil((replies * REPLY_COST_RUPEES * PACK_MARGIN) / 10) * 10;

export const PACKS = [5000, 10000, 25000].map(replies => ({ id: `replies-${replies}`, replies, price: priceOf(replies) }));
