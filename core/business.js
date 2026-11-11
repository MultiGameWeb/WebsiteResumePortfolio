// SiteCraft business details used on the Contact, Terms, Privacy and Refund pages.
// Fill these in once; every page picks them up. Empty values are hidden on the pages.
window.SITECRAFT_BUSINESS = {
  name: 'SiteCraft',            // brand name shown to customers
  legalName: '',                // registered / proprietor name, e.g. 'SiteCraft (Proprietor: Your Name)'
  email: '',                    // support email
  phone: '',                    // e.g. '+91 98765 43210'
  whatsapp: '',                 // digits only with country code, e.g. '919876543210'
  address: '',                  // full postal address
  hours: 'Monday to Saturday, 10:00 AM – 7:00 PM IST',
  grievanceOfficer: '',         // name of the person handling complaints
  city: 'Hyderabad, Telangana'  // courts for disputes
};
(() => {
  const b = window.SITECRAFT_BUSINESS;
  const fill = () => {
    document.querySelectorAll('[data-biz]').forEach(el => {
      const key = el.getAttribute('data-biz');
      const value = key === 'legalOrName' ? (b.legalName || b.name) : b[key];
      const row = el.closest('[data-biz-row]');
      if (!value) { if (row) row.hidden = true; return; }
      if (row) row.hidden = false;
      if (key === 'email') { el.textContent = value; if (el.tagName === 'A') el.href = 'mailto:' + value; }
      else if (key === 'phone') { el.textContent = value; if (el.tagName === 'A') el.href = 'tel:' + value.replace(/[^\d+]/g, ''); }
      else if (key === 'whatsapp') { el.textContent = '+' + value.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3'); if (el.tagName === 'A') el.href = 'https://wa.me/' + value; }
      else el.textContent = value;
    });
    const anyContact = b.email || b.phone || b.whatsapp;
    document.querySelectorAll('[data-biz-missing]').forEach(el => { el.hidden = Boolean(anyContact); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
})();
