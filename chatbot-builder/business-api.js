/**
 * BotCraft owner-scoped business workflow API.
 *
 * This module is deliberately separate from the conversational AI endpoint:
 * business facts, source extraction, owner answers and coverage are persisted
 * by dedicated authenticated Worker routes, never inferred from chat history.
 */
function baseUrl() {
  const configured = String(window.BOTCRAFT_CONFIG?.apiBaseUrl ?? '').trim();
  if (!configured) throw new Error('BotCraft Worker URL is not configured.');
  let url;
  try { url = new URL(configured); }
  catch { throw new Error('BotCraft API URL is invalid.'); }
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('BotCraft API must use HTTPS.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('BotCraft API URL must not contain credentials, query parameters or fragments.');
  }
  return url.origin;
}

async function token() {
  const provider = window.BotCraftAuth;
  if (!provider || typeof provider.getAccessToken !== 'function') {
    throw new Error('Secure BotCraft sign-in is not configured.');
  }
  const value = await provider.getAccessToken();
  if (typeof value !== 'string' || !value.trim() || value.length > 16384) {
    throw new Error('Please sign in to BotCraft, then try again.');
  }
  return value.trim();
}

async function request(path, { method = 'GET', body } = {}) {
  const [origin, bearer] = [baseUrl(), await token()];
  const response = await fetch(origin + path, {
    method,
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(45000),
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${bearer}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('BotCraft returned an unreadable response. Please retry.'); }
  if (!response.ok) {
    const code = result?.error?.code;
    if (response.status === 401 || code === 'AUTH_REQUIRED') {
      throw new Error('Your BotCraft sign-in is missing or expired. Sign in again, then retry.');
    }
    if (response.status === 403) throw new Error('This website is not allowed to use the BotCraft API.');
    throw new Error(typeof result?.error?.message === 'string' ? result.error.message : 'BotCraft could not complete this business step.');
  }
  return result;
}

function id(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) {
    throw new Error(`A valid ${label} is required.`);
  }
  return encodeURIComponent(value);
}

export const listBusinesses = () => request('/api/botcraft/businesses');

export function createBusiness({ businessName, category, websiteOrigin, preferredLanguage }) {
  if (typeof businessName !== 'string' || !businessName.trim() || businessName.trim().length > 160) {
    throw new Error('Enter a business name of 160 characters or fewer.');
  }
  if (typeof category !== 'string' || !category.trim() || category.length > 40) {
    throw new Error('Choose a business category.');
  }
  return request('/api/botcraft/businesses', {
    method: 'POST',
    body: {
      businessName: businessName.trim(),
      category: category.trim(),
      ...(websiteOrigin === undefined ? {} : { websiteOrigin }),
      ...(preferredLanguage === undefined ? {} : { preferredLanguage }),
    },
  });
}

export function saveBusinessSource(businessId, { text, name }) {
  if (typeof text !== 'string' || !text.trim() || text.length > 500000) {
    throw new Error('Source text must contain 1–500,000 characters.');
  }
  return request(`/api/botcraft/businesses/${id(businessId, 'business ID')}/sources`, {
    method: 'POST',
    body: { text, ...(name === undefined ? {} : { name }) },
  });
}

export function extractBusinessSource(businessId, sourceId) {
  return request(
    `/api/botcraft/businesses/${id(businessId, 'business ID')}/sources/${id(sourceId, 'source ID')}/extract`,
    { method: 'POST', body: {} },
  );
}

export function saveBusinessAnswer(businessId, { questionId, knowledgeKey, answer, notApplicable }) {
  if (typeof questionId !== 'string' || !questionId.trim() || questionId.length > 200) {
    throw new Error('A valid question ID is required.');
  }
  if (typeof knowledgeKey !== 'string' || !knowledgeKey.trim() || knowledgeKey.length > 160) {
    throw new Error('A valid knowledge key is required.');
  }
  if (answer !== undefined && (typeof answer !== 'string' || !answer.trim() || answer.length > 12000)) {
    throw new Error('Owner answers must contain 1–12,000 characters.');
  }
  if (notApplicable !== undefined && typeof notApplicable !== 'boolean') {
    throw new Error('notApplicable must be true or false.');
  }
  if (answer === undefined && notApplicable !== true) {
    throw new Error('Provide an answer or mark this question not applicable.');
  }
  return request(`/api/botcraft/businesses/${id(businessId, 'business ID')}/answers`, {
    method: 'POST',
    body: { questionId, knowledgeKey, ...(answer === undefined ? {} : { answer }), ...(notApplicable === undefined ? {} : { notApplicable }) },
  });
}

export function recalculateBusinessCoverage(businessId) {
  return request(`/api/botcraft/businesses/${id(businessId, 'business ID')}/coverage/recalculate`, {
    method: 'POST',
    body: {},
  });
}
