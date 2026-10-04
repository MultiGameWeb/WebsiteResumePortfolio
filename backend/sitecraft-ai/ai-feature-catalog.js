// SiteCraft AI feature catalog.
// Pricing is backend-controlled; AI can only return feature IDs, never prices.

export const BASE_PRICE_INR = 499;

export const BASE_FEATURE_IDS = [
  "home",
  "gallery",
  "enquiry",
  "whatsapp",
  "call",
  "location"
];

export const FEATURE_CATALOG = [
  { id:"services", name:"Services", description:"Show services offered to customers.", worker:"sections", priceInr:49, businessTypes:["service","photography","salon","clinic","gym","restaurant","real_estate","education","general"], priority:100 },
  { id:"admin_panel", name:"Admin Panel", description:"Control website content and customer data from an admin area.", worker:"functions", priceInr:399, requiresBackend:true, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:100 },
  { id:"live_chat", name:"Live Chat", description:"Let website visitors chat with the business.", worker:"functions", priceInr:299, requiresBackend:true, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:95 },
  { id:"testimonials", name:"Testimonials", description:"Customer reviews and trust-building testimonials.", worker:"sections", priceInr:49, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:95 },
  { id:"booking", name:"Online Booking", description:"Let customers request or book a service.", worker:"functions", priceInr:199, requiresBackend:true, businessTypes:["service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:90 },
  { id:"pricing", name:"Pricing / Packages", description:"Show prices or packages clearly.", worker:"sections", priceInr:49, businessTypes:["service","photography","salon","gym","restaurant","education","general"], priority:85 },
  { id:"team", name:"Team", description:"Team or staff profile cards.", worker:"sections", priceInr:49, businessTypes:["service","clinic","gym","restaurant","education","general"], priority:70 },
  { id:"faq", name:"FAQ", description:"Frequently asked questions with expandable answers.", worker:"sections", priceInr:49, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:75 },
  { id:"instagram", name:"Instagram Link", description:"Prominent Instagram profile and social CTA.", worker:"functions", priceInr:49, businessTypes:["photography","salon","restaurant","general","service"], priority:90 },
  { id:"social_links", name:"Social Media Links", description:"Social profile links for the business.", worker:"functions", priceInr:49, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:65 },
  { id:"google_reviews", name:"Google Reviews Link", description:"Direct visitors to the business reviews page.", worker:"functions", priceInr:49, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:70 },
  { id:"google_analytics", name:"Google Analytics", description:"Analytics integration placeholder/configuration.", worker:"functions", priceInr:99, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:40 },
  { id:"seo_pack", name:"SEO Pack", description:"SEO titles, descriptions, structured headings and metadata.", worker:"ui", priceInr:99, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:80 },
  { id:"newsletter", name:"Newsletter", description:"Newsletter signup block.", worker:"functions", priceInr:49, businessTypes:["general","service","photography","restaurant","education"], priority:45 },
  { id:"blog", name:"Blog", description:"Blog/news section for publishing articles.", worker:"sections", priceInr:99, requiresBackend:true, businessTypes:["general","service","photography","clinic","education","real_estate"], priority:55 },
  { id:"gallery_categories", name:"Gallery Categories", description:"Filterable gallery categories.", worker:"sections", priceInr:49, businessTypes:["photography","restaurant","real_estate","general"], priority:90 },
  { id:"lightbox_gallery", name:"Lightbox Gallery", description:"Full-screen image lightbox interaction.", worker:"ui", priceInr:49, businessTypes:["photography","restaurant","real_estate","general"], priority:95 },
  { id:"video_gallery", name:"Video Gallery", description:"Dedicated video showcase area.", worker:"sections", priceInr:99, businessTypes:["photography","general","service","restaurant","education"], priority:85 },
  { id:"portfolio", name:"Portfolio", description:"Project/work portfolio showcase.", worker:"sections", priceInr:49, businessTypes:["photography","service","general","interior","real_estate"], priority:95 },
  { id:"event_packages", name:"Event Packages", description:"Photography/event package cards.", worker:"sections", priceInr:49, businessTypes:["photography","event"], priority:95 },
  { id:"appointment_slots", name:"Appointment Slots", description:"Selectable appointment time slots.", worker:"functions", priceInr:199, requiresBackend:true, businessTypes:["clinic","salon","service","education","gym"], priority:90 },
  { id:"contact_map", name:"Interactive Map", description:"Enhanced location/map section.", worker:"functions", priceInr:49, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:65 },
  { id:"business_hours", name:"Business Hours", description:"Open/closed timings and weekly schedule.", worker:"functions", priceInr:49, businessTypes:["general","service","salon","clinic","gym","restaurant","real_estate","education"], priority:75 },
  { id:"call_back_request", name:"Call Back Request", description:"Request-a-callback form.", worker:"functions", priceInr:49, businessTypes:["service","photography","salon","clinic","real_estate","education"], priority:65 },
  { id:"lead_dashboard", name:"Lead Dashboard", description:"Admin lead list and lead status tracking.", worker:"functions", priceInr:199, requiresBackend:true, businessTypes:["service","photography","salon","clinic","gym","real_estate","education"], priority:88 },
  { id:"customer_reviews", name:"Review Submission", description:"Customer review submission form.", worker:"functions", priceInr:99, requiresBackend:true, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:60 },
  { id:"product_catalogue", name:"Product Catalogue", description:"Product cards and catalogue layout.", worker:"sections", priceInr:99, businessTypes:["shop","restaurant","general"], priority:95 },
  { id:"basic_cart", name:"Basic Cart", description:"Basic product cart for a limited catalogue.", worker:"functions", priceInr:299, requiresBackend:true, businessTypes:["shop","restaurant","general"], priority:100 },
  { id:"order_whatsapp", name:"Order on WhatsApp", description:"Send cart/order details to WhatsApp.", worker:"functions", priceInr:99, businessTypes:["shop","restaurant","general"], priority:100 },
  { id:"payment_gateway", name:"Payment Gateway", description:"Payment gateway integration scaffold.", worker:"functions", priceInr:499, requiresBackend:true, businessTypes:["shop","restaurant","service","general","education"], priority:100 },
  { id:"coupon_codes", name:"Coupon Codes", description:"Discount/coupon support.", worker:"functions", priceInr:199, requiresBackend:true, businessTypes:["shop","restaurant","service","general"], priority:55 },
  { id:"delivery_charges", name:"Delivery Charges", description:"Delivery fee rules and display.", worker:"functions", priceInr:99, requiresBackend:true, businessTypes:["shop","restaurant"], priority:80 },
  { id:"product_search", name:"Product Search", description:"Search products or catalogue items.", worker:"ui", priceInr:99, businessTypes:["shop","restaurant","real_estate"], priority:65 },
  { id:"product_filters", name:"Product Filters", description:"Filter/sort catalogue items.", worker:"ui", priceInr:99, businessTypes:["shop","restaurant","real_estate"], priority:60 },
  { id:"wishlist", name:"Wishlist", description:"Save favourite items.", worker:"functions", priceInr:149, businessTypes:["shop","restaurant"], priority:35 },
  { id:"customer_login", name:"Customer Login", description:"Customer account/login area.", worker:"functions", priceInr:299, requiresBackend:true, businessTypes:["shop","service","education","gym"], priority:50 },
  { id:"member_area", name:"Member Area", description:"Member-only pages or content.", worker:"functions", priceInr:299, requiresBackend:true, businessTypes:["gym","education","service"], priority:50 },
  { id:"course_list", name:"Course List", description:"Courses/training catalogue.", worker:"sections", priceInr:49, businessTypes:["education","gym"], priority:85 },
  { id:"class_schedule", name:"Class Schedule", description:"Class/batch timetable.", worker:"sections", priceInr:49, businessTypes:["gym","education"], priority:85 },
  { id:"trainer_profiles", name:"Trainer Profiles", description:"Trainer or expert profiles.", worker:"sections", priceInr:49, businessTypes:["gym","service","education"], priority:80 },
  { id:"before_after_gallery", name:"Before & After Gallery", description:"Transformation before/after showcase.", worker:"sections", priceInr:49, businessTypes:["gym","salon","clinic","interior"], priority:80 },
  { id:"property_listings", name:"Property Listings", description:"Property cards with details and filters.", worker:"sections", priceInr:99, businessTypes:["real_estate"], priority:100 },
  { id:"property_filters", name:"Property Filters", description:"Filter properties by price/type/location.", worker:"ui", priceInr:99, businessTypes:["real_estate"], priority:95 },
  { id:"property_enquiry", name:"Property Enquiry", description:"Lead form attached to each property.", worker:"functions", priceInr:99, businessTypes:["real_estate"], priority:95 },
  { id:"virtual_tour", name:"Virtual Tour", description:"Virtual/360 tour showcase block.", worker:"sections", priceInr:149, businessTypes:["real_estate","interior"], priority:90 },
  { id:"price_estimator", name:"Price Estimator", description:"Interactive price estimate component.", worker:"functions", priceInr:149, businessTypes:["real_estate","interior"], priority:70 },
  { id:"menu", name:"Menu", description:"Menu/food service listing.", worker:"sections", priceInr:49, businessTypes:["restaurant","catering"], priority:100 },
  { id:"online_ordering", name:"Online Ordering", description:"Online ordering flow.", worker:"functions", priceInr:299, requiresBackend:true, businessTypes:["restaurant","shop"], priority:100 },
  { id:"table_booking", name:"Table Booking", description:"Restaurant table reservation request.", worker:"functions", priceInr:149, requiresBackend:true, businessTypes:["restaurant"], priority:90 },
  { id:"doctor_profile", name:"Doctor Profile", description:"Doctor/specialist profile with credentials.", worker:"sections", priceInr:49, businessTypes:["clinic"], priority:95 },
  { id:"treatment_list", name:"Treatment List", description:"Treatments/services offered by a clinic.", worker:"sections", priceInr:49, businessTypes:["clinic"], priority:95 },
  { id:"certifications", name:"Certifications & Trust Badges", description:"Certification, hygiene and trust badge area.", worker:"sections", priceInr:49, businessTypes:["clinic","catering","service","restaurant"], priority:55 },
  { id:"faq_accordion", name:"FAQ Accordion", description:"Interactive FAQ accordion component.", worker:"ui", priceInr:49, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:70 },
  { id:"contact_form_advanced", name:"Advanced Enquiry Form", description:"Additional enquiry fields and qualification questions.", worker:"functions", priceInr:99, businessTypes:["service","photography","real_estate","education","general"], priority:80 },
  { id:"download_brochure", name:"Download Brochure", description:"Downloadable brochure CTA.", worker:"functions", priceInr:49, businessTypes:["real_estate","interior","service","education"], priority:55 },
  { id:"privacy_page", name:"Privacy Policy Page", description:"Dedicated privacy policy page.", worker:"sections", priceInr:49, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:45 },
  { id:"terms_page", name:"Terms & Conditions Page", description:"Dedicated terms page.", worker:"sections", priceInr:49, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:40 },
  { id:"pwa", name:"Installable PWA", description:"Progressive web app install support.", worker:"functions", priceInr:149, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:35 },
  { id:"dark_mode", name:"Dark Mode", description:"Dark/light appearance toggle.", worker:"ui", priceInr:49, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:45 },
  { id:"multilingual", name:"Multi-language", description:"Language switcher and localized content scaffolding.", worker:"ui", priceInr:149, businessTypes:["general","service","photography","education","restaurant"], priority:45 },
  { id:"custom_domain", name:"Custom Domain Setup", description:"Custom-domain connection workflow.", worker:"functions", priceInr:300, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:50 },
  { id:"admin_media_library", name:"Admin Media Library", description:"Admin interface for website media assets.", worker:"functions", priceInr:149, requiresBackend:true, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:65 },
  { id:"content_editor", name:"Admin Content Editor", description:"Edit website text/content from admin.", worker:"functions", priceInr:199, requiresBackend:true, businessTypes:["general","service","photography","salon","clinic","gym","restaurant","real_estate","education"], priority:80 }
];

export function getFeature(featureId) {
  return FEATURE_CATALOG.find(item => item.id === featureId) || null;
}

export function getEligibleFeatures({ businessType, installedIds = [], suggestedIds = [] }) {
  const installed = new Set(installedIds);
  const suggested = new Set(suggestedIds);
  const type = String(businessType || "general").toLowerCase();
  return FEATURE_CATALOG
    .filter(item => !installed.has(item.id) && !suggested.has(item.id))
    .filter(item => item.businessTypes.includes("general") || item.businessTypes.includes(type))
    .sort((a,b) => b.priority - a.priority);
}
