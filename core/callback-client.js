// Success page: when the customer asked for domain or online-payment help at checkout, send one
// call-back request to SiteCraft so the executive can call within 20 minutes.
(() => {
  const API = (window.SITECRAFT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev').replace(/\/+$/, '');
  if (!window.Store) return;
  const s = Store.read();
  const wantsDomain = s.domainWanted === 'yes';
  const wantsPayment = s.customerOnlinePayment === 'yes';
  const note = document.getElementById('callNote');
  if (!s.paid || (!wantsDomain && !wantsPayment) || !note) return;
  const phone = s.callbackPhone || (s.data && s.data.contact && (s.data.contact.phone || s.data.contact.whatsapp)) || '';
  const what = wantsDomain && wantsPayment ? 'your domain and online payments' : wantsDomain ? 'your domain' : 'online payments';
  note.hidden = false;
  note.querySelector('strong').textContent = 'Our executive will call you within 20 minutes' + (phone ? ' on ' + phone : '') + '.';
  note.querySelector('span').textContent = 'They will help you with ' + what + '. Domain charges and our service charge are extra.';
  if (s.callbackSent) return;
  const send = async (attempt) => {
    try {
      const res = await fetch(API + '/api/requests/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (s.data && s.data.brand && s.data.brand.ownerName) || '',
          business: (s.data && s.data.brand && s.data.brand.businessName) || '',
          phone, templateId: s.templateId || '', domain: wantsDomain, onlinePayment: wantsPayment,
          siteUrl: s.hostedUrl || ''
        })
      });
      if (res.ok) { Store.update({ callbackSent: true }); return; }
      if (res.status >= 500 && attempt < 3) setTimeout(() => send(attempt + 1), 4000 * attempt);
      else note.querySelector('span').textContent = 'We could not send your call request automatically. Please message us on WhatsApp for help with ' + what + '.';
    } catch {
      if (attempt < 3) setTimeout(() => send(attempt + 1), 4000 * attempt);
    }
  };
  send(1);
})();
