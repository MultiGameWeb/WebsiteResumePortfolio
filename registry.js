window.SITECRAFT_TEMPLATES = [
  {
    id: "photography-01",
    name: "Photography — Editorial",
    category: "Photography",
    price: "₹4,999",
    thumbnail: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
    manifest: "templates/photography-01/template.json",
    module: "templates/photography-01/template.js"
  },
  {
    id: "photography-02",
    name: "Photography — Cinematic",
    category: "Photography",
    price: "₹4,999",
    thumbnail: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",
    manifest: "templates/photography-02/template.json",
    module: "templates/photography-02/template.js"
  }
];

window.getTemplate = (id) => window.SITECRAFT_TEMPLATES.find(t => t.id === id);