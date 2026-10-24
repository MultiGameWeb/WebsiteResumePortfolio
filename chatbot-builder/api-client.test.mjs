import test from 'node:test';
import assert from 'node:assert/strict';

const originalWindow = globalThis.window;
const originalFetch = globalThis.fetch;

function configure({ apiBaseUrl = '', auth = null } = {}) {
  globalThis.window = {
    BOTCRAFT_CONFIG: { apiBaseUrl },
    ...(auth ? { BotCraftAuth: auth } : {}),
  };
}

test('fails closed when Worker URL is missing', async () => {
  const { sendChatAction } = await import('./api-client.js');
  let fetchCalled = false;
  globalThis.fetch = async () => { fetchCalled = true; throw new Error('unexpected network'); };
  configure();
  const result = await sendChatAction({ text: 'hello', history: [{ role: 'user', text: 'hello' }] });
  assert.equal(result.ok, false);
  assert.match(result.error, /Worker API URL has not been configured/);
  assert.equal(fetchCalled, false);
});

test('fails closed when sign-in provider is missing', async () => {
  const { sendChatAction } = await import('./api-client.js');
  let fetchCalled = false;
  globalThis.fetch = async () => { fetchCalled = true; throw new Error('unexpected network'); };
  configure({ apiBaseUrl: 'https://botcraft.example.workers.dev' });
  const result = await sendChatAction({ text: 'hello', history: [{ role: 'user', text: 'hello' }] });
  assert.equal(result.ok, false);
  assert.match(result.error, /Secure sign-in is not configured/);
  assert.equal(fetchCalled, false);
});

test('sends a bounded interview request with a bearer token and returns the real API answer', async () => {
  const { sendChatAction } = await import('./api-client.js');
  let captured;
  configure({
    apiBaseUrl: 'https://botcraft.example.workers.dev',
    auth: { async getAccessToken() { return 'short-lived-test-token'; } },
  });
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({ text: 'What is your business name?', requestId: 'req-test' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const result = await sendChatAction({
    text: 'Create restaurant chatbot',
    history: [{ role: 'assistant', text: 'Welcome' }, { role: 'user', text: 'Create restaurant chatbot' }],
  });
  assert.equal(result.ok, true);
  assert.equal(result.message.text, 'What is your business name?');
  assert.equal(captured.url, 'https://botcraft.example.workers.dev/api/chatbot/ai');
  assert.equal(captured.options.headers.Authorization, 'Bearer short-lived-test-token');
  assert.equal(captured.body.task, 'interview');
  assert.equal(captured.body.messages.at(-1).role, 'user');
  assert.equal(captured.body.messages.at(-1).content, 'Create restaurant chatbot');
  assert.equal(captured.body.files.length, 0);
});

test('rejects non-HTTPS production API URLs without sending a request', async () => {
  const { sendChatAction } = await import('./api-client.js');
  let fetchCalled = false;
  configure({
    apiBaseUrl: 'http://botcraft.example.workers.dev',
    auth: { async getAccessToken() { return 'short-lived-test-token'; } },
  });
  globalThis.fetch = async () => { fetchCalled = true; throw new Error('unexpected network'); };
  const result = await sendChatAction({ text: 'hello' });
  assert.equal(result.ok, false);
  assert.match(result.error, /must use HTTPS/);
  assert.equal(fetchCalled, false);
});


test('maps expired authentication to a clear sign-in error', async () => {
  const { sendChatAction } = await import('./api-client.js');
  configure({
    apiBaseUrl: 'https://botcraft.example.workers.dev',
    auth: { async getAccessToken() { return 'expired-test-token'; } },
  });
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { code: 'AUTH_REQUIRED', message: 'Sign in required.' },
  }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  const result = await sendChatAction({ text: 'hello' });
  assert.equal(result.ok, false);
  assert.match(result.error, /sign-in is missing or expired/i);
});

test('rejects API URLs containing query parameters without sending a request', async () => {
  const { sendChatAction } = await import('./api-client.js');
  let fetchCalled = false;
  configure({
    apiBaseUrl: 'https://botcraft.example.workers.dev/?token=not-allowed',
    auth: { async getAccessToken() { return 'short-lived-test-token'; } },
  });
  globalThis.fetch = async () => { fetchCalled = true; throw new Error('unexpected network'); };
  const result = await sendChatAction({ text: 'hello' });
  assert.equal(result.ok, false);
  assert.match(result.error, /without credentials or query parameters/i);
  assert.equal(fetchCalled, false);
});

test.after(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  globalThis.fetch = originalFetch;
});
