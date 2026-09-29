/* SiteCraft Photography Template 01 v3 — default content + admin data model */
(() => {
  const image = {
    hero: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2200&q=90',
    wedding: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=88',
    portrait: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1400&q=88',
    nature: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=88',
    birthday: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=88',
    corporate: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=88',
    couple: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=88'
  };

  const id = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

  window.PHOTOGRAPHY_DEFAULTS = {
    version: '3.0.0',
    settings: {
      showTopRibbon: true,
      showAbout: true,
      showServices: true,
      showVideo: true,
      showGallery: true,
      showReviews: true,
      showContact: true,
      showFaq: true,
      showPrivacy: true,
      showHeroBadge: true,
      animations: true,
      showSocials: true,
      brandAccent: '#a88350',
      passwordProtected: false,
      adminPassword: ''
    },
    brand: {
      businessName: 'Lumière Frames',
      ownerName: 'Studio by Ananya',
      motto: 'Stories, beautifully framed.',
      about: 'We turn real moments into timeless photographs with a calm, candid and editorial approach.',
      experience: '8+ years of experience',
      teamStyle: 'Weddings · Portraits · Brands'
    },
    ui: {
      navAbout: 'About',
      navServices: 'Services',
      navGallery: 'Gallery',
      navReviews: 'Reviews',
      navContact: 'Contact',
      formNameLabel: 'Your name',
      formPhoneLabel: 'Phone number',
      formMessageLabel: 'Message',
      formNamePlaceholder: 'Your name',
      formPhonePlaceholder: '+91 98765 43210',
      formMessagePlaceholder: 'Tell us about your shoot',
      formSubmit: 'Send enquiry',
      mobileBarText: 'Planning a shoot?',
      mobileBarTitle: 'Check your date',
      mobileBarButton: 'WhatsApp',
      callLabel: 'Call',
      emailLabel: 'Email',
      locationLabel: 'Location',
      mapsButton: 'Get directions',
      whatsappButton: 'WhatsApp',
      watchFilmLabel: 'Watch film',
      storageEmptyText: 'No images in storage yet.'
    },
    home: {
      ribbonText: 'Now booking weddings, portraits & brand stories',
      ribbonCta: 'Check availability →',
      heroBadge: 'PHOTOGRAPHY STUDIO',
      heroTitle: 'Moments that feel like forever.',
      heroSubtitle: 'Candid wedding, portrait and brand photography crafted with a cinematic eye.',
      primaryText: 'View portfolio',
      secondaryText: 'WhatsApp us',
      proof1: '8+ years',
      proof2: '500+ stories',
      proof3: 'Hyderabad & travel',
      midEyebrow: 'YOUR STORY DESERVES MORE THAN A FOLDER',
      midTitle: 'Make the feeling impossible to forget.',
      midText: 'From first look to final print, every frame is designed to feel personal, warm and unmistakably yours.',
      midButton: 'Plan your shoot'
    },
    mediaLibrary: [
      { id: id('img'), name: 'Hero — Couple', type: 'image', src: image.hero },
      { id: id('img'), name: 'Wedding — Golden Hour', type: 'image', src: image.wedding },
      { id: id('img'), name: 'Portrait — Quiet Light', type: 'image', src: image.portrait },
      { id: id('img'), name: 'Nature — Open Air', type: 'image', src: image.nature },
      { id: id('img'), name: 'Birthday — Celebration', type: 'image', src: image.birthday },
      { id: id('img'), name: 'Corporate — Team Story', type: 'image', src: image.corporate },
      { id: id('img'), name: 'Couple — After The Vows', type: 'image', src: image.couple }
    ],
    videos: [],
    hero: { mediaId: '', imageFallback: image.hero },
    copy: {
      aboutEyebrow: 'ABOUT THE STUDIO',
      servicesEyebrow: 'WHAT WE OFFER',
      servicesTitle: 'Packages & services',
      servicesCaption: 'Clear packages. Thoughtful coverage. A finished gallery your family keeps forever.',
      videoEyebrow: 'WATCH THE STORY',
      videoTitle: 'A little taste of the way we see.',
      galleryEyebrow: 'SELECTED WORK',
      galleryTitle: 'Portfolio',
      reviewsEyebrow: 'KIND WORDS',
      reviewsTitle: 'Reviews & ratings',
      reviewLabel: 'average customer rating',
      contactEyebrow: 'GET IN TOUCH',
      contactTitle: "Let’s make your date memorable.",
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
      callNumber: '+91 98765 43210',
      whatsapp: '919876543210',
      email: 'hello@lumiereframes.com',
      locationName: 'Banjara Hills, Hyderabad, Telangana',
      mapsUrl: 'https://maps.google.com/?q=Banjara+Hills+Hyderabad'
    },
    socials: {
      instagram: 'https://instagram.com/',
      facebook: 'https://facebook.com/',
      youtube: 'https://youtube.com/',
      pinterest: 'https://pinterest.com/'
    },
    services: [
      { id: id('svc'), name: 'Weddings', price: 'Packages from ₹45,000', description: 'Full-day storytelling, candid coverage, family portraits and a cinematic highlight film.', enabled: true },
      { id: id('svc'), name: 'Pre-Wedding', price: 'Packages from ₹22,000', description: 'Two-location couple sessions with concept planning and cinematic edits.', enabled: true },
      { id: id('svc'), name: 'Maternity', price: 'Packages from ₹12,000', description: 'Elegant indoor or outdoor portraits with guided posing and styling support.', enabled: true },
      { id: id('svc'), name: 'Birthdays', price: 'Packages from ₹8,000', description: 'Fun documentary-style coverage for celebrations and family moments.', enabled: true },
      { id: id('svc'), name: 'Corporate', price: 'Custom quote', description: 'Brand portraits, team photography, events and social-media-ready visuals.', enabled: true }
    ],
    gallery: [
      { id: id('gal'), title: 'Golden Hour Vows', category: 'Weddings', mediaId: '', fallbackImage: image.wedding, videoId: '', enabled: true },
      { id: id('gal'), title: 'Quiet Portrait', category: 'Portraits', mediaId: '', fallbackImage: image.portrait, videoId: '', enabled: true },
      { id: id('gal'), title: 'Into the Wild', category: 'Nature', mediaId: '', fallbackImage: image.nature, videoId: '', enabled: true },
      { id: id('gal'), title: 'Celebration Lights', category: 'Birthdays', mediaId: '', fallbackImage: image.birthday, videoId: '', enabled: true },
      { id: id('gal'), title: 'Team Stories', category: 'Corporate', mediaId: '', fallbackImage: image.corporate, videoId: '', enabled: true },
      { id: id('gal'), title: 'After The Vows', category: 'Weddings', mediaId: '', fallbackImage: image.couple, videoId: '', enabled: true }
    ],
    reviews: [
      { id: id('rev'), name: 'Ananya & Rohan', text: 'They made the whole day feel effortless. The photos are full of emotion and tiny moments we almost missed.', rating: 5, source: 'Google', enabled: true },
      { id: id('rev'), name: 'Kavya', text: 'Beautiful direction, quick communication and a gallery that feels exactly like us.', rating: 5, source: 'Facebook', enabled: true },
      { id: id('rev'), name: 'Arjun — Founder', text: 'Our team portraits finally look premium and consistent across our website and LinkedIn.', rating: 4, source: 'Google', enabled: true }
    ],
    faqs: [
      { id: id('faq'), question: 'Do you travel for shoots? How are location charges handled?', answer: 'Yes. We travel for destination and outstation shoots. Travel and accommodation are quoted separately based on the location.', enabled: true },
      { id: id('faq'), question: 'How many days does it take to deliver photos and the edited album?', answer: 'Preview images usually arrive within 5–7 days. Final edited galleries and albums are delivered according to the selected package.', enabled: true },
      { id: id('faq'), question: 'What is the booking process? How much advance payment is required?', answer: 'Choose your package, confirm the date and pay the booking advance. The remaining balance is scheduled before final delivery.', enabled: true },
      { id: id('faq'), question: 'What is your cancellation or reschedule policy?', answer: 'We support date changes subject to availability. Cancellation and rescheduling terms are confirmed in the booking agreement.', enabled: true }
    ],
    privacy: 'We use enquiry details only to respond to your request and provide our services. We do not sell personal information.'
  };

  window.PHOTOGRAPHY_DEFAULTS.hero.mediaId = window.PHOTOGRAPHY_DEFAULTS.mediaLibrary[0].id;
  window.PHOTOGRAPHY_DEFAULTS.gallery[0].mediaId = window.PHOTOGRAPHY_DEFAULTS.mediaLibrary[1].id;
  window.PHOTOGRAPHY_DEFAULTS.gallery[1].mediaId = window.PHOTOGRAPHY_DEFAULTS.mediaLibrary[2].id;
  window.PHOTOGRAPHY_DEFAULTS.gallery[2].mediaId = window.PHOTOGRAPHY_DEFAULTS.mediaLibrary[3].id;
  window.PHOTOGRAPHY_DEFAULTS.gallery[3].mediaId = window.PHOTOGRAPHY_DEFAULTS.mediaLibrary[4].id;
  window.PHOTOGRAPHY_DEFAULTS.gallery[4].mediaId = window.PHOTOGRAPHY_DEFAULTS.mediaLibrary[5].id;
  window.PHOTOGRAPHY_DEFAULTS.gallery[5].mediaId = window.PHOTOGRAPHY_DEFAULTS.mediaLibrary[6].id;
  window.PHOTOGRAPHY_TEMPLATE_DATA = structuredClone(window.PHOTOGRAPHY_DEFAULTS);
})();
