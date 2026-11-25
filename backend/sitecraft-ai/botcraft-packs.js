// AI reply recharge packs (rupees). Price = our Gemini cost x 1.30, rounded up to the next Rs 10.
// The cost basis is Rs 0.155 for one reply of a typical shop (about 5,700 tokens in, 200 out on gemini-3.1-flash-lite at
// $0.25 / $1.50 per 1M tokens, Rs 90 to the dollar). It is an estimate: check it against the token log after real use
// (admin bot panel) and change the prices here, in one place. See docs/BOTCRAFT_PRICING.md.
export const REPLY_COST_RUPEES = 0.155;
export const PACK_MARGIN = 1.3;
const priceOf = replies => Math.ceil((replies * REPLY_COST_RUPEES * PACK_MARGIN) / 10) * 10;

export const PACKS = [5000, 10000, 25000].map(replies => ({ id: `replies-${replies}`, replies, price: priceOf(replies) }));

// Build packages. The price is the build and hosting price (Rs 999 / 1,499 / 1,999) plus the included replies at
// Rs 0.20 each, which is our cost + about 30% (so the included replies are paid for by the price). After payment the
// admin adds `replies` to the shop (admin add_replies); there is no online payment yet.
export const PLANS = [
  { id: "starter", years: 1, basePrice: 999, replies: 500, price: 1099 },
  { id: "growth", years: 2, basePrice: 1499, replies: 1000, price: 1699 },
  { id: "pro", years: 3, basePrice: 1999, replies: 1500, price: 2299 }
];
