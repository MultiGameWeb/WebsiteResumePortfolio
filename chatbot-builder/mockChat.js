/**
 * BotCraft's only outbound-action placeholder.
 *
 * Replace sendChatAction() with the future backend request. Text messages,
 * quick answers, attachments, and retries all pass through this function.
 * Files remain local to the browser in this mock; nothing is uploaded.
 */
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const option = (label, value = label) => ({
  id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 7)}`,
  label,
  value,
  kind: 'answer',
});

function response(text, options = []) {
  return { id: `bot-${crypto.randomUUID?.() ?? Date.now()}`, text, options, time: new Date() };
}

/**
 * @param {import('./types.js').ChatAction} action
 * @returns {Promise<{ ok: true, message: { id: string, text: string, options: object[], time: Date } } | { ok: false, error: string }>}
 */
// The first owner message is treated as the shop type in this demo.
let shopTypeKnown = false;

export async function sendChatAction(action) {
  // PLACEHOLDER: Connect this single function to the future BotCraft API.
  // Do not put Gemini keys, credentials, or direct API calls in this frontend.
  await wait(550 + Math.random() * 450);

  const text = String(action.text ?? action.option?.value ?? '').trim();
  const lower = text.toLowerCase();

  // A predictable test phrase lets you try the failed-message/retry UI.
  if (lower.includes('simulate error') || lower.includes('test failed message')) {
    return { ok: false, error: 'The demo could not send that message. Please try again.' };
  }

  const askDetails = 'Please send your shop’s full details — photos of your items and price boards, price lists or catalogues (PDF, Excel), and anything else in your own words. Use + to attach files.';

  if (action.attachments?.length) {
    const count = action.attachments.length;
    return {
      ok: true,
      message: response(
        `Thanks — I received ${count} file${count === 1 ? '' : 's'}${text ? ' and your note' : ''}. In the live version I will read them, create your item cards (photo, name, price, details) and fill every answer I can. Then I will ask you only the remaining questions. Anything else to send?`,
        [option('Send more details'), option('That’s all for now')],
      ),
    };
  }

  if (!shopTypeKnown && !lower.includes('that’s all') && !lower.includes('skip for now')) {
    shopTypeKnown = true;
    return {
      ok: true,
      message: response(`Nice to meet you! Of course — we can build an AI shop assistant for your shop. I am preparing the questions your customers usually ask.\n\n${askDetails}`, [option('I’ll type the details'), option('Skip for now')]),
    };
  }

  if (lower.includes('that’s all') || lower.includes('skip for now')) {
    return {
      ok: true,
      message: response('Okay. In the live version I would now ask the questions your details did not cover — the most important ones first, each with quick options. What is your shop name?', [option('Skip for now')]),
    };
  }

  if (lower.includes('send more') || lower.includes('type the details')) {
    return { ok: true, message: response(askDetails) };
  }

  return {
    ok: true,
    message: response('Thanks, I’ve noted that in this demo. When BotCraft is connected to AI, I’ll use it to answer your customers accurately. What else should customers know about your shop?', [option('Send more details'), option('That’s all for now')]),
  };
}