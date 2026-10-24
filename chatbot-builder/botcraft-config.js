/**
 * Public, non-secret BotCraft browser configuration.
 * Configure these values only after setting up the matching Google OAuth client
 * and deploying the Worker with matching AUTH_ISSUER / AUTH_JWKS_URL / AUTH_AUDIENCE.
 * Never place Gemini keys, client secrets, or bearer tokens in this file.
 */
window.BOTCRAFT_CONFIG = Object.freeze({
  apiBaseUrl: '',
  googleClientId: '',
});
