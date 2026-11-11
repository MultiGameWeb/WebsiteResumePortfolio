// SiteCraft auto hosting (success page): publishes the customer's website to the SiteCraft Worker
// and shows the live link. The Worker builds the site from the genuine template code; this page
// only sends the template id, the customer's details and the selected features.
(() => {
  const API = (window.SITECRAFT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev').replace(/\/+$/, '');
  const card = document.getElementById('hostCard');
  if (!card || !window.Store) return;
  const q = s => card.querySelector(s);
  const state = Store.read();
  const templateId = state.templateId || (window.SITECRAFT_TEMPLATES && SITECRAFT_TEMPLATES[0] && SITECRAFT_TEMPLATES[0].id);
  const KEY = 'sitecraft:hosted:' + templateId;
  const readSaved = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const writeSaved = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  const slugify = v => String(v || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/g, '');

  const input = q('#hostSlug'), btn = q('#hostBtn'), status = q('#hostStatus'), result = q('#hostResult');
  q('#hostPrefix').textContent = API + '/s/';
  const preview = () => { q('#hostPreviewSlug').textContent = slugify(input.value) || 'your-shop-name'; };

  function setStatus(text, kind) {
    status.textContent = text || '';
    status.className = 'host-status' + (text ? ' show' : '') + (kind ? ' ' + kind : '');
  }

  function showResult(saved, fresh) {
    result.hidden = false;
    const link = q('#hostLink');
    link.href = saved.url;
    link.textContent = saved.url;
    q('#hostKeyWrap').hidden = !saved.editKey;
    q('#hostKey').textContent = saved.editKey || '';
    q('#hostResultTitle').textContent = fresh ? 'Your website is live!' : 'Your website is online';
    input.value = saved.slug;
    input.disabled = true;
    q('#hostPreviewSlug').textContent = saved.slug;
    btn.textContent = 'Update live website';
  }

  const saved = readSaved();
  if (saved && saved.slug) showResult(saved, false);
  else input.value = slugify(state.data && state.data.brand && state.data.brand.businessName) || '';
  preview();

  if (!state.paid) {
    btn.disabled = true;
    setStatus('Please complete checkout first. Then you can publish your website here.', 'error');
  }

  async function publish() {
    const current = readSaved();
    const slug = current && current.slug ? current.slug : slugify(input.value);
    if (!current && slug.length < 3) { setStatus('Please type a website address with at least 3 letters or numbers.', 'error'); input.focus(); return; }
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = current ? 'Updating…' : 'Publishing…';
    setStatus(current ? 'Updating your live website…' : 'Putting your website online. This takes a few seconds…');
    try {
      const fresh = Store.read();
      const res = await fetch(API + '/api/hosting/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          data: fresh.data || {},
          selected: fresh.selectedFeatures || null,
          slug,
          editKey: current && current.editKey ? current.editKey : undefined
        })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.message || out.error || ('Publishing failed (' + res.status + ').'));
      const next = { slug: out.slug, url: out.url, editKey: out.editKey || (current && current.editKey) || '', publishedAt: new Date().toISOString() };
      writeSaved(next);
      Store.update({ hostedSlug: next.slug, hostedUrl: next.url });
      showResult(next, Boolean(out.created));
      setStatus(out.created ? (out.slug !== slug ? 'That address was taken, so we used ' + out.slug + '.' : '') : 'Updated. Refresh your website to see the changes.', 'success');
      btn.textContent = 'Update live website';
    } catch (e) {
      setStatus(e.message === 'Failed to fetch' ? 'Could not reach the SiteCraft server. Please check your internet and try again.' : e.message, 'error');
      btn.textContent = label;
    } finally {
      btn.disabled = !Store.read().paid;
    }
  }

  btn.addEventListener('click', publish);
  input.addEventListener('input', () => { const c = input.selectionStart; input.value = input.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'); try { input.setSelectionRange(c, c); } catch {} preview(); });
  q('#hostCopy').addEventListener('click', async () => {
    const link = q('#hostLink').href;
    try { await navigator.clipboard.writeText(link); q('#hostCopy').textContent = 'Copied'; } catch { prompt('Copy your website link:', link); }
    setTimeout(() => { q('#hostCopy').textContent = 'Copy link'; }, 1600);
  });
  q('#hostShare').addEventListener('click', () => {
    const link = q('#hostLink').href;
    window.open('https://wa.me/?text=' + encodeURIComponent('Visit our website: ' + link), '_blank', 'noopener');
  });
})();
