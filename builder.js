(() => {
  const id = new URLSearchParams(location.search).get("template") || "photography-01";
  const template = getTemplate(id);
  if (!template) { location.href = "index.html"; return; }

  let manifest, mod;
  const state = Store.read();

  async function boot() {
    const [manifestResp, module] = await Promise.all([
      fetch(template.manifest).then(r => r.json()),
      import(`../${template.module}`)
    ]);
    manifest = manifestResp;
    mod = module;

    document.getElementById("templateName").textContent = manifest.name;
    document.getElementById("templateCategory").textContent = manifest.category;

    const selected = state.selectedFeatures?.length ? state.selectedFeatures : manifest.features.map(f => f.id);
    const data = state.data && state.templateId === id ? state.data : structuredClone(manifest.demoData);
    Store.update({templateId:id, data, selectedFeatures:selected});

    renderFeatureBox(selected);
    renderFieldBox(data);
    renderPreview(data, selected);
    bindDevices();
  }

  function renderFeatureBox(selected) {
    document.getElementById("featureBox").innerHTML = `
      <div class="builder-block">
        <p class="eyebrow">FEATURES</p><h2>Choose what appears</h2><p>Turn optional sections on or off.</p>
        <div class="feature-list">${manifest.features.map(f => `
          <label><input type="checkbox" data-feature="${f.id}" ${selected.includes(f.id) ? "checked" : ""}> ${f.label}</label>`).join("")}</div>
      </div>`;
    document.querySelectorAll("[data-feature]").forEach(el => el.addEventListener("change", () => {
      const next = [...document.querySelectorAll("[data-feature]:checked")].map(x => x.dataset.feature);
      Store.update({selectedFeatures:next}); renderPreview(getData(), next);
    }));
  }

  function renderFieldBox(data) {
    document.getElementById("fieldBox").innerHTML = `
      <div class="builder-block"><p class="eyebrow">YOUR DETAILS</p><h2>Enter only what you need</h2><p>Your template starts with sample details so you can see the final look.</p>
      ${manifest.fields.map(field => field.type === "textarea" ? `
        <label class="field"><span>${field.label}${field.required ? "" : " · optional"}</span><textarea data-field="${field.key}" placeholder="${field.placeholder || ""}">${data[field.key] ?? ""}</textarea></label>` : `
        <label class="field"><span>${field.label}${field.required ? "" : " · optional"}</span><input data-field="${field.key}" type="${field.type || "text"}" value="${escapeHtml(data[field.key] ?? "")}" placeholder="${field.placeholder || ""}"></label>`).join("")}
      </div>`;
    document.querySelectorAll("[data-field]").forEach(el => el.addEventListener("input", () => {
      const data = getData(); data[el.dataset.field] = el.value; Store.update({data}); renderPreview(data, getSelected());
    }));
  }

  function getData() {
    const data = {};
    document.querySelectorAll("[data-field]").forEach(el => data[el.dataset.field] = el.value);
    return data;
  }
  function getSelected() { return [...document.querySelectorAll("[data-feature]:checked")].map(x => x.dataset.feature); }
  function escapeHtml(v){return String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

  function renderPreview(data, selected) {
    document.getElementById("sitePreview").innerHTML = mod.render(data, selected);
  }

  function bindDevices() {
    document.querySelectorAll("[data-device]").forEach(btn => btn.addEventListener("click", () => {
      document.querySelectorAll("[data-device]").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("previewFrame").className = `preview-frame ${btn.dataset.device}`;
    }));
    document.getElementById("previewBtn").addEventListener("click", () => location.href = "checkout.html");
    document.getElementById("resetBtn").addEventListener("click", () => { Store.clear(); location.reload(); });
  }
  boot().catch(err => {
    console.error(err);
    document.getElementById("sitePreview").innerHTML = `<div style="padding:30px;color:#b44">Template failed to load. Check the template manifest/module path.</div>`;
  });
})();