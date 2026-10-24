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

test('business API fails closed without configured URL or authentication', async () => {
  const api = await import('./business-api.js');
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error('unexpected network'); };

  configure();
  await assert.rejects(api.listBusinesses(), /Worker URL is not configured/);
  configure({ apiBaseUrl: 'https://botcraft.example.workers.dev' });
  await assert.rejects(api.listBusinesses(), /Secure BotCraft sign-in is not configured/);
  assert.equal(calls, 0);
});

test('creates a business workspace using bearer authentication and the owner route', async () => {
  const api = await import('./business-api.js');
  let captured;
  configure({
    apiBaseUrl: 'https://botcraft.example.workers.dev',
    auth: { async getAccessToken() { return 'short-lived-test-token'; } },
  });
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({ business: { businessId: 'business-1' }, coverage: {} }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  };
  const result = await api.createBusiness({
    businessName: 'My Cafe', category: 'restaurant', preferredLanguage: 'en',
  });
  assert.equal(result.business.businessId, 'business-1');
  assert.equal(captured.url, 'https://botcraft.example.workers.dev/api/botcraft/businesses');
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.headers.Authorization, 'Bearer short-lived-test-token');
  assert.deepEqual(captured.body, { businessName: 'My Cafe', category: 'restaurant', preferredLanguage: 'en' });
});

test('encodes business and source identifiers before calling extraction route', async () => {
  const api = await import('./business-api.js');
  let capturedUrl = '';
  configure({
    apiBaseUrl: 'https://botcraft.example.workers.dev',
    auth: { async getAccessToken() { return 'short-lived-test-token'; } },
  });
  globalThis.fetch = async (url) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({ extraction: { facts: [] }, coverage: {} }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  };
  await api.extractBusinessSource('biz one', 'source/segment');
  assert.equal(
    capturedUrl,
    'https://botcraft.example.workers.dev/api/botcraft/businesses/biz%20one/sources/source%2Fsegment/extract',
  );
});

test('validates owner answers before sending a request', async () => {
  const api = await import('./business-api.js');
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error('unexpected network'); };
  configure({
    apiBaseUrl: 'https://botcraft.example.workers.dev',
    auth: { async getAccessToken() { return 'short-lived-test-token'; } },
  });
  await assert.rejects(
    api.saveBusinessAnswer('biz-1', { questionId: 'q1', knowledgeKey: 'business.hours' }),
    /Provide an answer or mark this question not applicable/,
  );
  assert.equal(calls, 0);
});

test.after(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  globalThis.fetch = originalFetch;
});
