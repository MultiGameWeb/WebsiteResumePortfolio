/* SiteCraft Photography Template 01 — editable defaults */
window.PHOTOGRAPHY_DEFAULTS = {
  settings: {
    showAbout: true,
    showServices: true,
    showGallery: true,
    showReviews: true,
    showContact: true,
    showFaq: true,
    showPrivacy: true,
    showHeroBadge: true,
    showTopRibbon: true,
    animations: true,
    brandAccent: '#a88350',
    priceLabel: 'Packages from ₹45,000'
  },
  brand: {
    studioName: 'Lumière Frames',
    motto: 'Stories, beautifully framed.',
    about: 'We turn real moments into timeless photographs with a calm, candid and editorial approach.',
    experience: '8+ years of experience',
    teamStyle: 'Weddings · Portraits · Brands'
  },
  hero: {
    badge: 'PHOTOGRAPHY STUDIO',
    title: 'Moments that feel like forever.',
    subtitle: 'Candid wedding, portrait and brand photography crafted with a cinematic eye.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2200&q=90',
    primaryText: 'View portfolio',
    secondaryText: 'WhatsApp us'
  },
  copy: {
    aboutEyebrow: 'ABOUT THE STUDIO',
    servicesEyebrow: 'WHAT WE OFFER',
    servicesTitle: 'Packages & services',
    servicesCaption: 'Clear packages. Thoughtful coverage. A finished gallery your family keeps forever.',
    midEyebrow: 'YOUR STORY DESERVES MORE THAN A FOLDER',
    midTitle: 'Make the feeling impossible to forget.',
    midText: 'From first look to final print, every frame is designed to feel personal, warm and unmistakably yours.',
    midButton: 'Plan your shoot',
    galleryEyebrow: 'SELECTED WORK',
    galleryTitle: 'Portfolio',
    reviewsEyebrow: 'KIND WORDS',
    reviewsTitle: 'Reviews & ratings',
    reviewLabel: 'average customer rating',
    contactEyebrow: 'GET IN TOUCH',
    contactTitle: 'Let's make your date memorable.',
    contactCopy: 'Tell us a little about the shoot. We’ll reply with availability, package options and next steps.',
    faqEyebrow: 'FAQ',
    faqTitle: 'Frequently asked',
    footerPrivacyLabel: 'Privacy',
    footerBackLabel: 'Back to top',
    footerFaqLabel: 'FAQs',
    footerEnquiryLabel: 'Enquiry',
    footerAdminLabel: 'Admin'
  },
  contact: {
    phone: '+91 98765 43210',
    email: 'hello@lumiereframes.com',
    address: 'Banjara Hills, Hyderabad, Telangana',
    whatsapp: '919876543210',
    mapsUrl: 'https://maps.google.com/?q=Banjara+Hills+Hyderabad'
  },
  socials: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    youtube: 'https://youtube.com/',
    pinterest: 'https://pinterest.com/'
  },
  services: [
    { id:'s1', name:'Weddings', price:'Packages from ₹45,000', description:'Full-day storytelling, candid coverage, family portraits and a cinematic highlight film.' },
    { id:'s2', name:'Pre-Wedding', price:'Packages from ₹22,000', description:'Two-location couple sessions with concept planning and cinematic edits.' },
    { id:'s3', name:'Maternity', price:'Packages from ₹12,000', description:'Elegant indoor or outdoor portraits with guided posing and styling support.' },
    { id:'s4', name:'Birthdays', price:'Packages from ₹8,000', description:'Fun documentary-style coverage for celebrations and family moments.' },
    { id:'s5', name:'Corporate', price:'Custom quote', description:'Brand portraits, team photography, events and social-media-ready visuals.' }
  ],
  gallery: [
    { id:'g1', title:'Golden Hour Vows', category:'Weddings', image:'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=88', video:'' },
    { id:'g2', title:'Quiet Portrait', category:'Portraits', image:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1400&q=88', video:'' },
    { id:'g3', title:'Into the Wild', category:'Nature', image:'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=88', video:'' },
    { id:'g4', title:'Celebration Lights', category:'Birthdays', image:'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=88', video:'' },
    { id:'g5', title:'Team Stories', category:'Corporate', image:'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=88', video:'' },
    { id:'g6', title:'After The Vows', category:'Weddings', image:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=88', video:'' }
  ],
  reviews: [
    { id:'r1', name:'Ananya & Rohan', text:'They made the whole day feel effortless. The photos are full of emotion and tiny moments we almost missed.', rating:5, source:'Google', approved:true },
    { id:'r2', name:'Kavya', text:'Beautiful direction, quick communication and a gallery that feels exactly like us.', rating:5, source:'Facebook', approved:true },
    { id:'r3', name:'Arjun — Founder', text:'Our team portraits finally look premium and consistent across our website and LinkedIn.', rating:4, source:'Google', approved:true }
  ],
  faqs: [
    { id:'f1', question:'Do you travel for shoots? How are location charges handled?', answer:'Yes. We travel for destination and outstation shoots. Travel and accommodation are quoted separately based on the location.' },
    { id:'f2', question:'How many days does it take to deliver photos and the edited album?', answer:'Preview images usually arrive within 5–7 days. Final edited galleries and albums are delivered according to the selected package.' },
    { id:'f3', question:'What is the booking process? How much advance payment is required?', answer:'Choose your package, confirm the date and pay the booking advance. The remaining balance is scheduled before final delivery.' },
    { id:'f4', question:'What is your cancellation or reschedule policy?', answer:'We support date changes subject to availability. Cancellation and rescheduling terms are confirmed in the booking agreement.' }
  ],
  privacy:'We use enquiry details only to respond to your request and provide our services. We do not sell personal information.'
};

window.PHOTOGRAPHY_TEMPLATE_DATA = structuredClone(window.PHOTOGRAPHY_DEFAULTS);
