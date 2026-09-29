const Store = {
  key: "sitecraft_builder_state_v1",
  read() {
    try { return JSON.parse(localStorage.getItem(this.key) || "{}"); } catch { return {}; }
  },
  write(state) { localStorage.setItem(this.key, JSON.stringify(state)); },
  update(patch) { const next = {...this.read(), ...patch}; this.write(next); return next; },
  clear() { localStorage.removeItem(this.key); },
};