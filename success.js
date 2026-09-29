(() => {
  const state = Store.read();
  const id = state.templateId || "photography-01";
  const template = getTemplate(id);

  document.getElementById("downloadBtn").addEventListener("click", async () => {
    const mod = await import(`../${template.module}`);
    const html = mod.renderFullHtml(state.data || {}, state.selectedFeatures || []);
    const blob = new Blob([html], {type:"text/html;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${id}-website.html`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  });

  document.getElementById("domainYes").addEventListener("click", () => {
    document.getElementById("domainCard").classList.add("hidden");
    document.getElementById("domainDone").classList.remove("hidden");
  });
  document.getElementById("domainNo").addEventListener("click", () => {
    document.getElementById("domainCard").classList.add("hidden");
    document.getElementById("domainLater").classList.remove("hidden");
  });
})();