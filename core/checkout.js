// Checkout (step 4): domain help, storage, online payment for the customer's own customers,
// one year of hosting, and the (demo) payment.
(() => {
  const s = Store.read();
  const id = new URLSearchParams(location.search).get('template') || s.templateId || 'restaurant-01';
  const t = getTemplate(id);
  if (!t) { location.href = 'index.html'; return; }
  if (s.templateId !== id) Store.update({ templateId: id });

  const BASE_PRICE = 599;
  const STORAGE_PRICE = 119;
  // What Cloudflare charges SiteCraft per website per year (₹). The customer pays this + 75%.
  // 0 while all sites fit in Cloudflare's free plan; hosting then shows as included.
  const HOSTING_COST_PER_YEAR = 0;
  const HOSTING_PRICE = Math.ceil(HOSTING_COST_PER_YEAR * 1.75);

  const q = sel => document.querySelector(sel);
  const rupees = n => '₹' + Number(n).toLocaleString('en-IN');
  let domain = s.domainWanted || 'no';
  let online = s.customerOnlinePayment || 'no';
  let storage = s.storageWanted || 'no';
  let method = s.paymentMethod || 'Demo Payment';
  const details = s.data || {};
  const phoneInput = q('#callPhone');
  if (phoneInput && !phoneInput.value) phoneInput.value = s.callbackPhone || (details.contact && (details.contact.phone || details.contact.whatsapp)) || '';

  const needsCall = () => domain === 'yes' || online === 'yes';
  const phoneOk = () => String(phoneInput ? phoneInput.value : '').replace(/[^\d]/g, '').length >= 10;
  const total = () => BASE_PRICE + HOSTING_PRICE + (storage === 'yes' ? STORAGE_PRICE : 0);

  function save(extra) {
    Store.update({
      domainWanted: domain, customerOnlinePayment: online, storageWanted: storage,
      storagePlanId: storage === 'yes' ? 'website-5gb' : null, paymentMethod: method,
      websitePrice: BASE_PRICE, hostingPrice: HOSTING_PRICE, storagePrice: storage === 'yes' ? STORAGE_PRICE : 0,
      totalPrice: total(), hostingIncluded: true, hostingYears: 1,
      callbackPhone: needsCall() && phoneInput ? phoneInput.value.trim() : (s.callbackPhone || ''),
      ...extra
    });
  }

  function sync() {
    q('#payBtn').textContent = 'Pay ' + rupees(total()) + ' & continue';
    document.querySelectorAll('[data-domain]').forEach(b => b.classList.toggle('active', b.dataset.domain === domain));
    document.querySelectorAll('[data-online-payment]').forEach(b => b.classList.toggle('active', b.dataset.onlinePayment === online));
    document.querySelectorAll('[data-storage]').forEach(b => b.classList.toggle('active', b.dataset.storage === storage));
    document.querySelectorAll('[data-method]').forEach(b => b.classList.toggle('active', b.dataset.method === method));
    q('#executiveMessage').hidden = !needsCall();
    q('#executiveMessage strong').textContent = 'After you download, our executive will call you within 20 minutes.';
    q('#executiveMessage span').textContent = domain === 'yes' && online === 'yes'
      ? 'They will set up your domain and online payments. Domain charges and our service charge are extra; the executive will tell you the exact amount first.'
      : domain === 'yes'
        ? 'They will help you choose and connect your domain. Domain charges and our service charge are extra; the executive will tell you the exact amount first.'
        : 'They will help you set up online payments. Our service charge is extra; the executive will tell you the exact amount first.';
    q('#checkoutPrice').textContent = rupees(BASE_PRICE);
    q('#hostingPrice').textContent = HOSTING_PRICE ? rupees(HOSTING_PRICE) : 'Included';
    q('#storagePrice').textContent = storage === 'yes' ? rupees(STORAGE_PRICE) : '₹0';
    q('#grandTotal').textContent = rupees(total());
    const agreed = Boolean(q('#agreeTerms') && q('#agreeTerms').checked);
    const blocked = (needsCall() && !phoneOk()) || !agreed;
    q('#callPhoneError').hidden = !(needsCall() && !phoneOk()) || !phoneInput.value;
    q('#payBtn').disabled = blocked;
    save();
  }

  document.querySelectorAll('[data-domain]').forEach(b => b.onclick = () => { domain = b.dataset.domain; sync(); });
  document.querySelectorAll('[data-online-payment]').forEach(b => b.onclick = () => { online = b.dataset.onlinePayment; sync(); });
  document.querySelectorAll('[data-storage]').forEach(b => b.onclick = () => { storage = b.dataset.storage; sync(); });
  document.querySelectorAll('[data-method]').forEach(b => b.onclick = () => { method = b.dataset.method; sync(); });
  if (phoneInput) phoneInput.addEventListener('input', sync);
  if (q('#agreeTerms')) q('#agreeTerms').addEventListener('change', sync);

  q('#payBtn').onclick = () => {
    if (needsCall() && !phoneOk()) { q('#callPhoneError').hidden = false; phoneInput.focus(); return; }
    if (!q('#agreeTerms').checked) { q('#agreeTerms').focus(); return; }
    const b = q('#payBtn');
    b.disabled = true;
    b.textContent = 'Processing…';
    save({ paid: true, paidAt: new Date().toISOString(), callbackSent: false, agreedNoRefundAt: new Date().toISOString() });
    setTimeout(() => { location.href = 'success.html'; }, 700);
  };
  q('#checkoutName').textContent = t.name;
  sync();
})();
