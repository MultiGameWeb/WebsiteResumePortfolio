/**
 * Google Identity Services sign-in for BotCraft.
 * GIS credential is a short-lived Google ID token, sent only as a bearer token
 * to the configured BotCraft Worker. It is held in memory only, never storage.
 * Backend must validate signature, issuer, audience and expiry (fail closed).
 */
(() => {
  const config = window.BOTCRAFT_CONFIG || {};
  let token = '';
  let expiresAt = 0;
  let loading = null;
  let initialized = false;
  const status = () => document.getElementById('botcraftAuthStatus');
  const mount = () => document.getElementById('botcraftGoogleButton');

  function setStatus(message, isError = false) {
    const node = status();
    if (!node) return;
    node.textContent = message;
    node.dataset.state = isError ? 'error' : 'info';
  }

  function parseExpiry(jwt) {
    try {
      const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
      const claims = JSON.parse(atob(padded));
      return typeof claims.exp === 'number' ? claims.exp * 1000 : 0;
    } catch {
      return 0;
    }
  }

  function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-botcraft-google-identity]');
      const script = existing || document.createElement('script');
      const timeout = window.setTimeout(() => reject(new Error('Google sign-in did not load. Check your connection and retry.')), 10000);
      const done = () => { window.clearTimeout(timeout); resolve(); };
      script.addEventListener('load', done, { once: true });
      script.addEventListener('error', () => {
        window.clearTimeout(timeout);
        reject(new Error('Google sign-in could not load. Check network or content-blocker settings.'));
      }, { once: true });
      if (!existing) {
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.dataset.botcraftGoogleIdentity = 'true';
        document.head.append(script);
      }
      if (window.google?.accounts?.id) done();
    }).catch(error => {
      loading = null;
      throw error;
    });
    return loading;
  }

  async function initialize() {
    const button = mount();
    if (!button) return;
    if (!config.googleClientId || !String(config.googleClientId).includes('.apps.googleusercontent.com')) {
      button.textContent = 'Google sign-in setup required';
      button.disabled = true;
      setStatus('Secure sign-in is not configured yet. No message or business data can be sent.', true);
      return;
    }
    button.disabled = true;
    button.textContent = 'Loading secure sign-in…';
    try {
      await loadGoogleScript();
      if (!window.google?.accounts?.id) throw new Error('Google sign-in is unavailable. Please retry.');
      if (!initialized) {
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: response => {
            if (typeof response?.credential !== 'string' || !response.credential) {
              token = '';
              expiresAt = 0;
              setStatus('Google sign-in failed. Please try again.', true);
              return;
            }
            token = response.credential;
            expiresAt = parseExpiry(token);
            setStatus('Signed in with Google for this browser session. Token stays in memory.');
            document.dispatchEvent(new CustomEvent('botcraft:auth-changed', { detail: { signedIn: true } }));
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        initialized = true;
      }
      button.replaceChildren();
      window.google.accounts.id.renderButton(button, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: Math.min(320, Math.max(220, button.clientWidth || 280)),
      });
      button.disabled = false;
      setStatus('Sign in to connect to your protected BotCraft workspace.');
    } catch (error) {
      button.textContent = 'Retry Google sign-in';
      button.disabled = false;
      button.addEventListener('click', initialize, { once: true });
      setStatus(error instanceof Error ? error.message : 'Google sign-in is unavailable.', true);
    }
  }

  window.BotCraftAuth = Object.freeze({
    async getAccessToken() {
      if (!token || !expiresAt || expiresAt <= Date.now() + 30000) {
        throw new Error('Your Google sign-in is missing or expired. Sign in again, then retry.');
      }
      return token;
    },
    isSignedIn() {
      return Boolean(token && expiresAt > Date.now() + 30000);
    },
    signOut() {
      token = '';
      expiresAt = 0;
      if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
      setStatus('Signed out. Sign in again before sending data.');
      document.dispatchEvent(new CustomEvent('botcraft:auth-changed', { detail: { signedIn: false } }));
    },
  });

  document.addEventListener('DOMContentLoaded', initialize, { once: true });
  if (document.readyState !== 'loading') initialize();
})();
