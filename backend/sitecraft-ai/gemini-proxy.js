// A Durable Object pinned to Western North America that forwards Gemini
// requests. Gemini rejects some Cloudflare locations ("User location is not
// supported for the API use"), and the [placement] hint in wrangler.toml is
// not guaranteed, so ai-engine.js retries through this object when that
// happens. It only ever calls the Gemini API host.
const GEMINI_HOST = "generativelanguage.googleapis.com";
const TIMEOUT_MS = 90000;

export class GeminiUsProxy {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.hostname !== GEMINI_HOST) return new Response("Not allowed.", { status: 403 });
    return fetch(url, {
      method: request.method,
      headers: request.headers,
      body: request.method === "POST" ? await request.text() : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  }
}

// The same object every time; it is created in "wnam" on first use and stays there.
export function geminiUsProxy(env) {
  const ns = env?.GEMINI_US_PROXY;
  return ns ? ns.get(ns.idFromName("gemini-us"), { locationHint: "wnam" }) : null;
}
