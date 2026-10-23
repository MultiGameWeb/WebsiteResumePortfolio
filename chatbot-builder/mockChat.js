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

  if (action.type === 'attachment' || (action.attachments?.length && !text)) {
    const count = action.attachments?.length ?? 0;
    const label = count === 1 ? 'file' : 'files';
    return {
      ok: true,
      message: response(
        `Thanks — I can see ${count} ${label} in this local demo. When the backend is connected, I’ll read the supported menu or business documents and use them to prepare your answers. What would you like me to look for first?`,
        [option('Menu items and prices'), option('Opening hours'), option('Contact details'), option('Skip for now')],
      ),
    };
  }

  if (lower.includes('create restaurant chatbot') || lower.includes('build my chatbot')) {
    return {
      ok: true,
      message: response('Wonderful. Let’s build this one step at a time. What is your restaurant or business name?', [option('Skip for now')]),
    };
  }

  if (lower.includes('upload my menu') || lower.includes('menu')) {
    return {
      ok: true,
      message: response('Great — attach a menu photo, PDF, or document with the + button below. You can also add a note about any special menu details I should pay attention to.'),
    };
  }

  if (lower.includes('price') || lower.includes('timing') || lower.includes('opening hours')) {
    return {
      ok: true,
      message: response('We’ll capture those accurately so your chatbot never has to guess. What are your usual opening and closing times? You can type them here or attach a menu or information sheet.', [option('I’ll share the timings'), option('Not sure yet'), option('Skip for now')]),
    };
  }

  if (lower === 'yes' || lower.startsWith('yes,') || lower === 'no' || lower.startsWith('no,')) {
    return {
      ok: true,
      message: response('Got it — I’ve noted your answer for this demo. Would you like to add a little more detail, or move to the next question?', [option('Add more detail'), option('Next question'), option('Skip for now')]),
    };
  }

  if (lower.includes('skip for now')) {
    return {
      ok: true,
      message: response('No problem. We can come back to that later. Does your business accept table reservations?', [option('Yes'), option('No'), option('Skip for now')]),
    };
  }

  if (lower.includes('next question')) {
    return {
      ok: true,
      message: response('Does your business accept table reservations or bookings?', [option('Yes'), option('No'), option('Skip for now')]),
    };
  }

  if (lower.includes('i need help')) {
    return {
      ok: true,
      message: response('I’ll keep this simple. You can answer in your own words, tap a quick option, or attach a menu or document using +. Let’s start with your business name. What should customers call your business?', [option('Skip for now')]),
    };
  }

  if (action.attachments?.length) {
    const count = action.attachments.length;
    return {
      ok: true,
      message: response(`Thanks — your note and ${count} attachment${count === 1 ? '' : 's'} are included in this local demo. Which details should I focus on?`, [option('Menu items and prices'), option('Opening hours'), option('Contact details'), option('Skip for now')]),
    };
  }

  return {
    ok: true,
    message: response('Thanks, I’ve noted that in this demo. To keep your business answers accurate, let’s take the next question one at a time. Does your business accept table reservations?', [option('Yes'), option('No'), option('Skip for now')]),
  };
}