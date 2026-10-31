(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const id = new URLSearchParams(location.search).get('template') || Store.read().templateId || 'restaurant-01';
  const template = getTemplate(id);
  if (!template) { location.href = 'index.html'; return; }
  const root = p => new URL(p, location.href).href;
  let manifest, selected = [];
  const clone = value => structuredClone(value);
  async function boot() {
    manifest = await fetch(root(template.manifest)).then(response => {
      if (!response.ok) throw Error('Manifest load failed');
      return response.json();
    });
    const store = Store.read();
    selected = store.templateId === id && Array.isArray(store.selectedFeatures)
      ? [...store.selectedFeatures]
      : (Array.isArray(manifest.defaultSelectedFeatures)
        ? [...manifest.defaultSelectedFeatures]
        : (manifest.features || []).map(feature => feature.id)).filter(featureId => featureId !== 'play-games');
    Store.update({
      templateId: id,
      data: store.templateId === id && store.data ? store.data : clone(manifest.demoData || {}),
      selectedFeatures: selected,
      paid: false
    });
    document.querySelector('#templateName').textContent = manifest.name || template.name;
    document.querySelector('#templateCategory').textContent = manifest.category || template.category || '';
    render();
    document.querySelector('#continueBtn').onclick = () => {
      Store.update({ templateId: id, selectedFeatures: [...selected], paid: false });
      location.href = 'builder.html?template=' + encodeURIComponent(id);
    };
  }
  function render() {
    const grid = document.querySelector('#featureGrid');
    const features = (manifest.features || []).filter(feature => feature.id !== 'play-games');
    grid.innerHTML = features.map((feature, index) => {
      const checked = selected.includes(feature.id);
      return '<label class="feature-card ' + (checked ? 'selected' : '') + '">' +
        '<input type="checkbox" data-feature="' + esc(feature.id) + '" ' + (checked ? 'checked' : '') + '>' +
        '<span class="feature-check">' + (checked ? '✓' : '') + '</span>' +
        '<span><strong>' + esc(feature.label) + '</strong><small>' +
        (index === 0 ? 'Included in the base layout' : 'Optional section') +
        '</small></span></label>';
    }).join('');
    grid.querySelectorAll('[data-feature]').forEach(input => {
      input.onchange = () => {
        selected = [...grid.querySelectorAll('[data-feature]:checked')].map(item => item.dataset.feature);
        render();
      };
    });
  }
  boot().catch(error => {
    console.error(error);
    document.querySelector('#featureNotice').textContent = 'Could not load this template. Please go back and select it again.';
    document.querySelector('#featureNotice').classList.add('show', 'error');
  });
})();