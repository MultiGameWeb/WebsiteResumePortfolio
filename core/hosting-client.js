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
    q('#hostConnect').hidden = true;
    showTerm(saved.hosting);
  }

  const day = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  // One year of hosting. The extra week after it ends is only mentioned once the year is over.
  function showTerm(h) {
    const term = q('#hostTerm'), renew = q('#hostRenew');
    if (!h || !h.expiresAt) { term.hidden = true; renew.hidden = true; return; }
    term.hidden = h.state !== 'active';
    term.textContent = 'Hosting valid till ' + day(h.expiresAt) + '.';
    renew.hidden = h.state === 'active';
    if (h.state === 'grace') {
      q('#hostRenewTitle').textContent = 'Your one-year hosting ended on ' + day(h.expiresAt) + '.';
      q('#hostRenewText').textContent = 'Good news: your website stays online for 7 extra days, until ' + day(h.graceEndsAt) + '. Renew before then to keep it running.';
    } else if (h.state === 'ended') {
      q('#hostRenewTitle').textContent = 'Your hosting has ended.';
      q('#hostRenewText').textContent = 'Your website is offline. Renew to bring it back with all your details.';
    }
  }

  function resetCard() {
    result.hidden = true;
    input.disabled = false;
    input.value = slugify(state.data && state.data.brand && state.data.brand.businessName) || '';
    preview();
    btn.textContent = 'Publish website';
    q('#hostConnect').hidden = false;
  }

  const saved = readSaved();
  if (saved && saved.slug) showResult(saved, false);
  // Refresh the hosting dates for a site published earlier.
  if (saved && saved.slug && saved.editKey) {
    fetch(API + '/api/hosting/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: saved.slug, editKey: saved.editKey }) })
      .then(r => r.ok ? r.json() : null)
      .then(out => { if (out && out.ok && out.hosting) { const next = { ...readSaved(), hosting: out.hosting }; writeSaved(next); showTerm(out.hosting); } })
      .catch(() => {});
  }
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
      if (out.error === 'HOSTING_ENDED' && out.hosting) { const c = readSaved(); if (c) { c.hosting = out.hosting; writeSaved(c); } showTerm(out.hosting); }
      if (!res.ok || !out.ok) throw new Error(out.message || out.error || ('Publishing failed (' + res.status + ').'));
      const next = { slug: out.slug, url: out.url, editKey: out.editKey || (current && current.editKey) || '', publishedAt: new Date().toISOString(), hosting: out.hosting || (current && current.hosting) };
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

  q('#hostConnectBtn').addEventListener('click', async () => {
    const slug = slugify(q('#hostConnectSlug').value.replace(/^.*\/s\//, '').replace(/\/.*$/, ''));
    const editKey = q('#hostConnectKey').value.trim();
    if (slug.length < 3 || !editKey) { setStatus('Please enter your website address and edit key.', 'error'); return; }
    const b = q('#hostConnectBtn');
    b.disabled = true;
    setStatus('Checking your edit key…');
    try {
      const res = await fetch(API + '/api/hosting/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, editKey }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || ('Could not check the key (' + res.status + ').'));
      if (out.templateId && out.templateId !== templateId) {
        setStatus('This website was made with a different template (' + out.templateId + '). Open that template in the builder, then come back here to update it.', 'error');
        return;
      }
      const next = { slug: out.slug, url: out.url, editKey, publishedAt: new Date().toISOString(), hosting: out.hosting };
      writeSaved(next);
      showResult(next, false);
      setStatus('Connected. Edit your details in the builder, then tap Update live website.', 'success');
    } catch (e) {
      setStatus(e.message === 'Failed to fetch' ? 'Could not reach the SiteCraft server. Please check your internet and try again.' : e.message, 'error');
    } finally {
      b.disabled = false;
    }
  });

  q('#hostRenewBtn').addEventListener('click', async () => {
    const b = q('#hostRenewBtn');
    const st = Store.read();
    const phone = st.callbackPhone || (st.data && st.data.contact && (st.data.contact.phone || st.data.contact.whatsapp)) || prompt('Your phone number for the renewal call:') || '';
    if (String(phone).replace(/[^\d]/g, '').length < 10) { setStatus('Please enter a valid 10-digit phone number.', 'error'); return; }
    b.disabled = true;
    try {
      const cur = readSaved() || {};
      const res = await fetch(API + '/api/requests/callback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, renewal: true, business: (st.data && st.data.brand && st.data.brand.businessName) || '', name: (st.data && st.data.brand && st.data.brand.ownerName) || '', templateId, siteUrl: cur.url || '' }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || 'Could not send the request.');
      setStatus('Thank you. Our executive will call you on ' + phone + ' within 20 minutes.', 'success');
      b.textContent = 'Renewal call requested';
    } catch (e) { setStatus(e.message === 'Failed to fetch' ? 'Could not reach the SiteCraft server. Please try again.' : e.message, 'error'); b.disabled = false; }
  });

  q('#hostForget').addEventListener('click', () => {
    if (!confirm('Publish as a new website with a new address? Your current website stays online. Keep its edit key if you want to update it later.')) return;
    try { localStorage.removeItem(KEY); } catch {}
    Store.update({ hostedSlug: null, hostedUrl: null });
    resetCard();
    setStatus('');
  });
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
