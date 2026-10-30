// Web Push for BotCraft: the owner gets a notification for a new customer
// question or request, and a customer for the shop's reply to their request.
// Standard Web Push (VAPID, RFC 8292) with encrypted messages (aes128gcm,
// RFC 8291), using only WebCrypto. The VAPID key pair is made once and kept in
// the database (see loadVapidKeys), so there is no secret to set up.
import { deletePushSubscription, listPushSubscriptions, loadVapidKeys } from "./botcraft-store.js";

const encoder = new TextEncoder();

export function base64Url(bytes) {
  let text = "";
  for (const byte of new Uint8Array(bytes)) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text) {
  const plain = String(text).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(plain + "=".repeat((4 - (plain.length % 4)) % 4)), c => c.charCodeAt(0));
}

const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
};

async function hmac(key, data) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data));
}

// The public key in the form browsers want for applicationServerKey.
export async function vapidPublicKey(env) {
  const { publicKey } = await loadVapidKeys(env);
  return publicKey;
}

// The VAPID Authorization header for one push service.
async function vapidHeader(env, endpoint) {
  const { publicKey, privateJwk } = await loadVapidKeys(env);
  const key = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const header = base64Url(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = base64Url(encoder.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: env.BOTCRAFT_PUSH_SUBJECT || "mailto:botcraft@sitecraft.app"
  })));
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${base64Url(signature)}, k=${publicKey}`;
}

// Encrypts a message for one subscription (RFC 8291, single record).
export async function encryptPayload(subscription, text) {
  const receiverPublic = fromBase64Url(subscription.p256dh);
  const authSecret = fromBase64Url(subscription.auth);
  const local = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublic = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));
  const receiverKey = await crypto.subtle.importKey("raw", receiverPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: receiverKey }, local.privateKey, 256));

  const prkKey = await hmac(authSecret, shared);
  const ikm = (await hmac(prkKey, concat(encoder.encode("WebPush: info\0"), receiverPublic, localPublic, new Uint8Array([1])))).slice(0, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(encoder.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(encoder.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, concat(encoder.encode(text), new Uint8Array([2]))));
  // Header: salt, record size (4096), key id length and the sender's public key.
  return concat(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([localPublic.length]), localPublic, cipher);
}

// Sends one message; a subscription the push service no longer knows is removed.
async function sendOne(env, subscription, message) {
  try {
    const body = await encryptPayload(subscription, JSON.stringify(message));
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: await vapidHeader(env, subscription.endpoint),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "high"
      },
      body
    });
    if (response.status === 404 || response.status === 410) await deletePushSubscription(env, subscription.endpoint);
    else if (!response.ok) console.error("BotCraft push failed", response.status, (await response.text()).slice(0, 200));
  } catch (error) {
    console.error("BotCraft push failed", error);
  }
}

async function sendAll(env, subscriptions, message) {
  await Promise.all(subscriptions.map(subscription => sendOne(env, subscription, message)));
}

// message: { title, body, url, tag }
export async function notifyOwner(env, shopId, message) {
  await sendAll(env, await listPushSubscriptions(env, shopId, "owner", ""), message);
}

export async function notifyCustomer(env, shopId, requestId, message) {
  await sendAll(env, await listPushSubscriptions(env, shopId, "customer", requestId), message);
}
