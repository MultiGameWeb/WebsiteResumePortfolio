(() => {
  const grid = document.getElementById("templateGrid");
  if (!grid) return;
  grid.innerHTML = window.SITECRAFT_TEMPLATES.map(t => `
    <article class="template-card">
      <img src="${t.thumbnail}" alt="${t.name}">
      <div class="template-card-body">
        <p class="eyebrow">${t.category}</p>
        <h3>${t.name}</h3>
        <p>Sample content included. Customize the details you need and preview it live.</p>
        <a class="btn primary small" href="builder.html?template=${encodeURIComponent(t.id)}">Select template →</a>
      </div>
    </article>
  `).join("");
})();