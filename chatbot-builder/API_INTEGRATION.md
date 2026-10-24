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
- Office documents may still appear in the attachment picker but are rejected by the API adapter until a trusted conversion/extraction stage is implemented.
- Gemini keys are never sent to the browser. No mock fallback runs after an API/auth/configuration error.
- The business workspace/source/extraction/coverage API is a separate workflow and is not yet wired into the conversation UI. This commit does not claim that business answers are persisted.

## Required release gates

1. Choose and configure an OIDC provider and implement its sign-in/session flow.
2. Configure the real Worker URL and verify GitHub Pages origin allowlisting.
3. Review and apply the additive BotCraft D1 migrations only after the migration review.
4. Test successful and failed auth, rate limits, supported attachments, and actual Gemini responses in a controlled non-production environment.
5. Wire the separate business-workflow endpoints and owner-confirmation/coverage screens.
6. Do not deploy to production or enable customer traffic merely because the frontend API adapter exists.
