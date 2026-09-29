(() => {
  "use strict";

  const data = window.PHOTOGRAPHY_TEMPLATE_DATA || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const filled = (value) => typeof value === "string" && value.trim() !== "";

  function waLink(number, message = "Hi! I would like to enquire about a photography shoot.") {
    const digits = String(number || "").replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : "#contact";
  }

  function setText(field, value) {
    $$(`[data-field="${field}"]`).forEach((node) => { node.textContent = value || ""; });
  }

  function setHref(field, value) {
    $$(`[data-field-link="${field}"]`).forEach((node) => {
      node.setAttribute("href", value || "#contact");
      node.hidden = !filled(value);
    });
  }

  function renderBase() {
    setText("studioName", data.brand?.studioName || "Your Studio");
    setText("motto", data.brand?.motto || "");
    setText("about", data.brand?.about || "");
    setText("experience", data.brand?.experience || "");
    setText("teamStyle", data.brand?.teamStyle || "");
    setText("heroTitle", data.hero?.title || data.brand?.studioName || "Your Studio");
    setText("heroSubtitle", data.hero?.subtitle || "");
    setText("phone", data.contact?.phone || "");
    setText("email", data.contact?.email || "");
    setText("address", data.contact?.address || "");
    setText("privacy", data.privacy || "");

    const hero = $("#heroImage");
    if (hero && filled(data.hero?.image)) hero.src = data.hero.image;

    setHref("phone", filled(data.contact?.phone) ? `tel:${data.contact.phone.replace(/\s+/g, "")}` : "");
    setHref("email", filled(data.contact?.email) ? `mailto:${data.contact.email}` : "");
    setHref("mapsUrl", data.contact?.mapsUrl || "");

    const studioName = data.brand?.studioName || "Your Studio";
    document.title = `${studioName} — Photography Studio`;

    const contactCard = $(".contact-card");
    if (contactCard) contactCard.hidden = !filled(data.contact?.phone) && !filled(data.contact?.email) && !filled(data.contact?.address) && !filled(data.contact?.whatsapp) && !filled(data.contact?.mapsUrl);

    const aboutSection = $("#about");
    if (aboutSection) aboutSection.hidden = !filled(data.brand?.about) && !filled(data.brand?.experience) && !filled(data.brand?.teamStyle);
    const faqSection = $("#faq");
    if (faqSection) faqSection.hidden = !(data.faqs || []).length;
  }

  function renderServices() {
    const grid = $("#servicesGrid");
    const section = $("#services");
    const services = (data.services || []).filter((item) => filled(item?.name));
    if (!grid || !section) return;
    section.hidden = services.length === 0;
    grid.innerHTML = services.map((item) => `
      <article class="service-card">
        <h3>${escapeHtml(item.name)}</h3>
        ${filled(item.price) ? `<strong>${escapeHtml(item.price)}</strong>` : ""}
        ${filled(item.description) ? `<p>${escapeHtml(item.description)}</p>` : ""}
      </article>
    `).join("");
  }

  function renderGallery() {
    const grid = $("#galleryGrid");
    const filters = $("#galleryFilters");
    const section = $("#gallery");
    const items = (data.gallery || []).filter((item) => filled(item?.image));
    if (!grid || !filters || !section) return;
    section.hidden = items.length === 0;

    const categories = ["All", ...new Set(items.map((item) => item.category).filter(filled))];
    filters.innerHTML = categories.map((category, index) => `<button class="filter${index === 0 ? " active" : ""}" data-filter="${escapeAttr(category)}">${escapeHtml(category)}</button>`).join("");

    const render = (category) => {
      const shown = category === "All" ? items : items.filter((item) => item.category === category);
      grid.innerHTML = shown.map((item) => `
        <figure class="gallery-card">
          <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title || item.category || "Photography portfolio image")}" loading="lazy">
          ${(filled(item.title) || filled(item.video)) ? `<figcaption><span>${escapeHtml(item.title || item.category)}</span>${filled(item.video) ? `<a href="${escapeAttr(item.video)}" target="_blank" rel="noreferrer">Watch film ↗</a>` : ""}</figcaption>` : ""}
        </figure>
      `).join("");
    };
    render("All");

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      $$(".filter", filters).forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      render(button.dataset.filter || "All");
    });
  }

  function renderReviews() {
    const grid = $("#reviewsGrid");
    const section = $("#reviews");
    const items = (data.reviews || []).filter((item) => filled(item?.name) && filled(item?.text));
    if (!grid || !section) return;
    section.hidden = items.length === 0;
    const average = items.length ? (items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / items.length).toFixed(1) : "0.0";
    $("#reviewAverage").textContent = average;
    grid.innerHTML = items.map((item) => {
      const rating = Math.max(0, Math.min(5, Number(item.rating || 0)));
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      return `<blockquote class="review-card"><div class="stars">${stars}</div><p>“${escapeHtml(item.text)}”</p><footer>${escapeHtml(item.name)} · via ${escapeHtml(item.source || "Customer")}</footer></blockquote>`;
    }).join("");
  }

  function renderFaqs() {
    const list = $("#faqList");
    const section = $("#faq");
    const items = (data.faqs || []).filter((item) => filled(item?.question) && filled(item?.answer));
    if (!list || !section) return;
    section.hidden = items.length === 0;
    list.innerHTML = items.map((item, index) => `
      <div class="faq-item">
        <button type="button" class="faq-question" aria-expanded="false" aria-controls="faqAnswer${index}">
          <span>${escapeHtml(item.question)}</span><span aria-hidden="true">＋</span>
        </button>
        <div class="faq-answer" id="faqAnswer${index}" hidden>${escapeHtml(item.answer)}</div>
      </div>
    `).join("");

    list.addEventListener("click", (event) => {
      const button = event.target.closest(".faq-question");
      if (!button) return;
      const answer = $("#" + button.getAttribute("aria-controls"));
      const expanded = button.getAttribute("aria-expanded") === "true";
      $$(".faq-question", list).forEach((node) => node.setAttribute("aria-expanded", "false"));
      $$(".faq-answer", list).forEach((node) => { node.hidden = true; });
      if (!expanded && answer) {
        button.setAttribute("aria-expanded", "true");
        answer.hidden = false;
      }
    });
  }

  function renderSocials() {
    const root = $("#socialLinks");
    if (!root) return;
    const socials = [
      ["Instagram", data.social?.instagram, "IG"],
      ["Facebook", data.social?.facebook, "FB"],
      ["YouTube", data.social?.youtube, "YT"],
      ["Pinterest", data.social?.pinterest, "P"],
    ].filter((item) => filled(item[1]));
    root.hidden = socials.length === 0;
    root.innerHTML = socials.map(([label, url, short]) => `<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer" aria-label="${escapeAttr(label)}"><span>${short}</span></a>`).join("");
  }

  function renderWhatsApp() {
    const number = data.contact?.whatsapp || "";
    const link = waLink(number);
    $$(".js-whatsapp, [data-whatsapp-only]").forEach((node) => {
      node.setAttribute("href", link);
      node.hidden = !filled(number);
    });
  }

  function setupMenu() {
    const toggle = $("#menuToggle");
    const nav = $("#siteNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("open", !open);
    });
    $$('a', nav).forEach((link) => link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    }));
  }

  function setupForm() {
    const form = $("#enquiryForm");
    const note = $("#formNote");
    if (!form || !note) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = $("#enquiryName").value.trim();
      const phone = $("#enquiryPhone").value.trim();
      const message = $("#enquiryMessage").value.trim();
      if (!name || !phone) {
        note.textContent = "Please enter your name and phone number.";
        note.className = "form-note error";
        return;
      }
      const saved = JSON.parse(localStorage.getItem("sitecraft-enquiries") || "[]");
      saved.unshift({ name, phone, message, createdAt: new Date().toISOString() });
      localStorage.setItem("sitecraft-enquiries", JSON.stringify(saved));
      note.textContent = "Thanks! Your enquiry has been received. (Demo form)";
      note.className = "form-note success";
      form.reset();
      showToast("Enquiry received (demo)");
    });
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[char]));
  }
  function escapeAttr(value) { return escapeHtml(value).replace(/'/g, "&#39;"); }

  renderBase();
  renderServices();
  renderGallery();
  renderReviews();
  renderFaqs();
  renderSocials();
  renderWhatsApp();
  setupMenu();
  setupForm();
})();
