/**
 * Public, non-secret BotCraft browser configuration.
 *
 * Set apiBaseUrl to the deployed BotCraft Worker origin after deployment.
 * Never place Gemini keys, OIDC client secrets, or bearer tokens in this file.
 * A reviewed sign-in module must provide window.BotCraftAuth.getAccessToken().
 */
window.BOTCRAFT_CONFIG = Object.freeze({
  apiBaseUrl: '',
});
