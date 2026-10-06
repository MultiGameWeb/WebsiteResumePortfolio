const DEFAULT_MODEL = "gemini-3.8-flash";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const KEY_ENV = {
  1: "GEMINI_API_KEY_1",
  2: "GEMINI_API_KEY_2",
  3: "GEMINI_API_KEY_3",
  4: "GEMINI_API_KEY_4",
  5: "GEMINI_API_KEY_5"
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function retryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get("Retry-After") || 0);
  if (retryAfter > 0) return Math.min(retryAfter * 1000, 5000);
  const exponential = Math.min(5000, 300 * (2 ** attempt));
  return exponential + Math.floor(Math.random() * 250);
}

async function readError(response) {
  const text = await response.text();
  let detail = text;
  try {
    const parsed = JSON.parse(text);
    detail = parsed?.error?.message || text;
  } catch {}
  return detail.slice(0, 1600);
}

export function getGeminiKeyStatus(env) {
  return Object.fromEntries(
    Object.entries(KEY_ENV).map(([slot, envName]) => [`key${slot}`, Boolean(env?.[envName])])
  );
}

export async function callGemini(env, keySlot, {
  system,
  prompt,
  schema,
  temperature = 0.3,
  maxOutputTokens
}) {
  const envName = KEY_ENV[keySlot];
  const apiKey = env?.[envName];
  const model = env?.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error(`${envName} is not configured.`);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature
    }
  };

  if (maxOutputTokens) body.generationConfig.maxOutputTokens = maxOutputTokens;

  let lastError = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const raw = await response.text();
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        throw new Error("Gemini returned invalid JSON.");
      }

      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(
          `Gemini returned no content (finishReason=${payload?.candidates?.[0]?.finishReason || "unknown"}).`
        );
      }

      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Gemini response body was not valid JSON.");
      }
    }

    const detail = await readError(response);
    lastError = new Error(`Gemini HTTP ${response.status}: ${detail}`);

    if (!RETRYABLE_STATUS.has(response.status) || attempt === 3) {
      throw lastError;
    }

    await sleep(retryDelay(response, attempt));
  }

  throw lastError || new Error("Gemini request failed.");
}

export async function runWorkerFanout(env, requests) {
  // K2/K3/K4 are logically independent. A tiny stagger smooths the burst
  // without turning the build into a slow sequential pipeline.
  return Promise.all([
    callGemini(env, 2, requests[2]),
    sleep(150).then(() => callGemini(env, 3, requests[3])),
    sleep(300).then(() => callGemini(env, 4, requests[4]))
  ]);
}
