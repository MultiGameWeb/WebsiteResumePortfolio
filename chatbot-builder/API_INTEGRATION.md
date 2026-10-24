# BotCraft browser API integration (draft)

The guided chat screen now calls the dedicated BotCraft Worker API client instead of the local mock. This is intentionally fail-closed: until the Worker origin and a reviewed authentication provider are configured, it shows a setup error and sends no message.

## Public browser configuration

Edit `botcraft-config.js` only to set the public Worker origin after the BotCraft Worker has been deployed, for example:

```js
window.BOTCRAFT_CONFIG = Object.freeze({
  apiBaseUrl: 'https://<your-deployed-botcraft-worker-origin>',
});
```

Use the real origin from the Cloudflare deployment. Do not guess a workers.dev hostname. The origin must be included in `CB_ALLOWED_ORIGINS` only if the app is served from a different origin than the existing GitHub Pages site. Never put Gemini keys, OAuth client secrets, or bearer tokens in this file.

## Authentication contract

A separately reviewed login module must expose:

```js
window.BotCraftAuth = {
  async getAccessToken() {
    // Return a short-lived ID/access token issued by the configured OIDC provider.
    // Do not read an arbitrary token from localStorage or accept a caller-supplied owner ID.
  },
};
```

The Worker independently verifies the JWT signature, issuer, audience, subject, and time claims. The browser hook is only a token transport; it is not an authorization boundary. The current Worker OIDC settings are blank, so protected requests must continue returning `401 AUTH_REQUIRED` until the identity provider, login flow, and Worker variables are configured and tested end-to-end. Do not bypass this response.

## Current browser behavior

- Text messages and quick replies use the protected `POST /api/chatbot/ai` endpoint with the `interview` task.
- Conversation history is kept in page memory and sent with each request; it is not persisted by the browser.
- Attachments are converted in memory and sent only for supported JPG/JPEG, PNG, WEBP, HEIC/HEIF, PDF, TXT, and CSV files, within the Worker limits.
- The attachment picker currently offers only the supported image, PDF, TXT, and CSV formats. Office documents are intentionally not offered until a trusted conversion/extraction stage is implemented.
- Gemini keys are never sent to the browser. No mock fallback runs after an API/auth/configuration error.
- The owner-authenticated business workflow panel now supports workspace creation, pasted-source saving, fact extraction, coverage summary, and the next owner-confirmation question. It uses the separate business API client and never guesses the server-owned knowledge key. The panel is still behind the same unconfigured sign-in and Worker prerequisites; this is not yet end-to-end tested against a deployed Worker.

## Required release gates

1. Choose and configure an OIDC provider and implement its sign-in/session flow.
2. Configure the real Worker URL and verify GitHub Pages origin allowlisting.
3. Review and apply the additive BotCraft D1 migrations only after the migration review.
4. Test successful and failed auth, rate limits, supported attachments, and actual Gemini responses in a controlled non-production environment.
5. End-to-end test the business-workflow panel against a controlled Worker, including workspace creation, source extraction, owner confirmation, coverage refresh, and failure/retry paths.
6. Do not deploy to production or enable customer traffic merely because the frontend API adapter exists.
