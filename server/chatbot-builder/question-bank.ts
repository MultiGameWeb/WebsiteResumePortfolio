/**
 * BotCraft question bank.
 *
 * The 35 curated customer-question intents are instantiated for 16 business
 * categories. This creates 560 stable, category-scoped patterns without asking
 * an LLM to invent the catalogue at runtime.
 *
 * This module is pure data/logic. It is not yet wired to the UI or database.
 */
export type BusinessCategoryId =
  | "restaurant" | "hotel" | "retail" | "ecommerce" | "salon"
  | "education" | "healthcare" | "real_estate" | "travel"
  | "professional_services" | "home_services" | "fitness"
  | "automotive" | "events" | "pet_services" | "general";

export type AnswerType =
  | "text" | "list" | "money" | "boolean" | "time"
  | "location" | "contact" | "policy" | "duration" | "process";

export type RequirementLevel = "mandatory" | "optional";

export interface QuestionPattern {
  /** Stable key, e.g. restaurant.operating_hours. */
  id: string;
  category: BusinessCategoryId;
  intent: string;
  question: string;
  variants: readonly string[];
  knowledgeKeys: readonly string[];
  answerType: AnswerType;
  requirement: RequirementLevel;
}

interface CategoryDefinition {
  id: BusinessCategoryId;
  label: string;
  businessLabel: string;
  offeringsLabel: string;
  bookingLabel: string;
  bookingAction: string;
  fulfillmentLabel: string;
  serviceAreaLabel: string;
  mandatoryIntents: readonly string[];
}

const CATEGORIES: readonly CategoryDefinition[] = [
  { id: "restaurant", label: "Restaurant / food", businessLabel: "restaurant", offeringsLabel: "menu items and food options", bookingLabel: "table reservation", bookingAction: "reserve a table", fulfillmentLabel: "dine-in, takeaway, or delivery", serviceAreaLabel: "delivery area", mandatoryIntents: ["business_identity", "main_offerings", "operating_hours", "location", "phone_contact", "human_handoff", "booking", "payment_methods"] },
  { id: "hotel", label: "Hotel / accommodation", businessLabel: "hotel or accommodation", offeringsLabel: "room types, amenities, and stay packages", bookingLabel: "room reservation", bookingAction: "reserve a room", fulfillmentLabel: "check-in, check-out, and guest services", serviceAreaLabel: "property location and nearby areas", mandatoryIntents: ["business_identity", "main_offerings", "operating_hours", "location", "phone_contact", "human_handoff", "booking", "payment_methods"] },
  { id: "retail", label: "Retail / local shop", businessLabel: "shop", offeringsLabel: "products and product options", bookingLabel: "purchase or store visit", bookingAction: "make a purchase or visit the shop", fulfillmentLabel: "in-store pickup or delivery", serviceAreaLabel: "delivery and service area", mandatoryIntents: ["business_identity", "main_offerings", "operating_hours", "location", "phone_contact", "human_handoff", "payment_methods"] },
  { id: "ecommerce", label: "E-commerce", businessLabel: "online store", offeringsLabel: "products, variations, and bundles", bookingLabel: "order", bookingAction: "place an order", fulfillmentLabel: "shipping, delivery, or digital access", serviceAreaLabel: "shipping destinations", mandatoryIntents: ["business_identity", "main_offerings", "phone_contact", "human_handoff", "fulfillment", "payment_methods", "cancellation_refunds"] },
  { id: "salon", label: "Salon / beauty", businessLabel: "salon or beauty business", offeringsLabel: "services, treatments, and packages", bookingLabel: "appointment", bookingAction: "book an appointment", fulfillmentLabel: "in-person appointments or at-home services", serviceAreaLabel: "service area", mandatoryIntents: ["business_identity", "main_offerings", "operating_hours", "location", "phone_contact", "human_handoff", "booking", "payment_methods"] },
  { id: "education", label: "Education / coaching", businessLabel: "education or coaching provider", offeringsLabel: "courses, subjects, and learning programs", bookingLabel: "course enrolment or consultation", bookingAction: "enrol or book a consultation", fulfillmentLabel: "in-person, live-online, or self-paced learning", serviceAreaLabel: "campus and online availability", mandatoryIntents: ["business_identity", "main_offerings", "phone_contact", "human_handoff", "eligibility", "payment_methods"] },
  { id: "healthcare", label: "Healthcare / clinic", businessLabel: "clinic or healthcare provider", offeringsLabel: "services, specialties, and appointment types", bookingLabel: "appointment", bookingAction: "book an appointment", fulfillmentLabel: "in-clinic or explicitly offered remote appointments", serviceAreaLabel: "clinic location and service area", mandatoryIntents: ["business_identity", "main_offerings", "operating_hours", "location", "phone_contact", "human_handoff", "booking", "eligibility"] },
  { id: "real_estate", label: "Real estate", businessLabel: "real-estate business", offeringsLabel: "properties, listings, and property services", bookingLabel: "property viewing or consultation", bookingAction: "arrange a viewing or consultation", fulfillmentLabel: "property visits and remote consultations", serviceAreaLabel: "property locations and service areas", mandatoryIntents: ["business_identity", "main_offerings", "phone_contact", "human_handoff", "booking", "eligibility"] },
  { id: "travel", label: "Travel / tourism", businessLabel: "travel business", offeringsLabel: "trips, tours, routes, and travel packages", bookingLabel: "trip or tour booking", bookingAction: "book a trip or tour", fulfillmentLabel: "meeting points, transport, and travel documents", serviceAreaLabel: "destinations and service areas", mandatoryIntents: ["business_identity", "main_offerings", "phone_contact", "human_handoff", "booking", "payment_methods", "cancellation_refunds"] },
  { id: "professional_services", label: "Professional services", businessLabel: "professional services firm", offeringsLabel: "services, consultations, and service packages", bookingLabel: "consultation", bookingAction: "schedule a consultation", fulfillmentLabel: "in-person or remote service delivery", serviceAreaLabel: "client service area", mandatoryIntents: ["business_identity", "main_offerings", "phone_contact", "human_handoff", "quote"] },
  { id: "home_services", label: "Local / home services", businessLabel: "local service business", offeringsLabel: "services, callouts, and service packages", bookingLabel: "service visit", bookingAction: "schedule a service visit", fulfillmentLabel: "on-site visits and any remote support offered", serviceAreaLabel: "service coverage area", mandatoryIntents: ["business_identity", "main_offerings", "phone_contact", "human_handoff", "service_area", "quote"] },
  { id: "fitness", label: "Fitness / wellness", businessLabel: "fitness or wellness business", offeringsLabel: "classes, sessions, memberships, and programs", bookingLabel: "class or session booking", bookingAction: "book a class or session", fulfillmentLabel: "in-person, group, or online sessions", serviceAreaLabel: "studio location and online coverage", mandatoryIntents: ["business_identity", "main_offerings", "operating_hours", "location", "phone_contact", "human_handoff", "booking", "eligibility"] },
  { id: "automotive", label: "Automotive", businessLabel: "automotive business", offeringsLabel: "vehicle services, parts, and service packages", bookingLabel: "service appointment", bookingAction: "schedule a vehicle service", fulfillmentLabel: "workshop service, pickup, or roadside help when offered", serviceAreaLabel: "workshop and roadside coverage area", mandatoryIntents: ["business_identity", "main_offerings", "operating_hours", "location", "phone_contact", "human_handoff", "booking", "quote"] },
  { id: "events", label: "Events / venues", businessLabel: "event or venue business", offeringsLabel: "event packages, venue options, and add-ons", bookingLabel: "event booking or venue visit", bookingAction: "request an event booking or venue visit", fulfillmentLabel: "venue access, event setup, and agreed services", serviceAreaLabel: "venue locations and service area", mandatoryIntents: ["business_identity", "main_offerings", "phone_contact", "human_handoff", "booking", "quote"] },
  { id: "pet_services", label: "Pet services", businessLabel: "pet services business", offeringsLabel: "pet-care services, packages, and products", bookingLabel: "pet-care appointment", bookingAction: "book a pet-care appointment", fulfillmentLabel: "in-store, at-home, or boarding services as offered", serviceAreaLabel: "service area and pickup coverage", mandatoryIntents: ["business_identity", "main_offerings", "phone_contact", "human_handoff", "booking", "eligibility"] },
  { id: "general", label: "General business", businessLabel: "business", offeringsLabel: "products and services", bookingLabel: "booking or enquiry", bookingAction: "make a booking or enquiry", fulfillmentLabel: "the service or delivery options you offer", serviceAreaLabel: "service area", mandatoryIntents: ["business_identity", "main_offerings", "phone_contact", "human_handoff"] },
];

interface IntentDefinition {
  id: string;
  answerType: AnswerType;
  knowledgeKeys: readonly string[];
  question: (category: CategoryDefinition) => string;
  variants: (category: CategoryDefinition) => readonly string[];
}

const INTENTS: readonly IntentDefinition[] = [
  { id: "business_identity", answerType: "text", knowledgeKeys: ["business.name"], question: c => `What name should customers use for your ${c.businessLabel}?`, variants: c => [`How is your ${c.businessLabel} called?`, `What is the correct business name?`] },
  { id: "main_offerings", answerType: "list", knowledgeKeys: ["business.offerings"], question: c => `What ${c.offeringsLabel} do you provide?`, variants: c => [`What can customers get from your ${c.businessLabel}?`, `Which products or services should the chatbot explain?`] },
  { id: "operating_hours", answerType: "time", knowledgeKeys: ["business.hours"], question: c => `What are the official opening hours for your ${c.businessLabel}?`, variants: c => [`When are you open?`, `What are your daily opening and closing times?`] },
  { id: "weekend_hours", answerType: "time", knowledgeKeys: ["business.weekend_hours"], question: c => `Do your opening hours change on weekends or holidays?`, variants: () => [`Are you open on public holidays?`, `Do weekend timings differ?`] },
  { id: "location", answerType: "location", knowledgeKeys: ["business.address", "business.map_url"], question: c => `Where is your ${c.businessLabel} located, and how can customers find it?`, variants: c => [`What address should customers use for your ${c.businessLabel}?`, `Can you share your location or directions?`] },
  { id: "service_area", answerType: "list", knowledgeKeys: ["business.service_area"], question: c => `Which areas are covered by your ${c.serviceAreaLabel}?`, variants: c => [`Where do you provide service?`, `Which locations are eligible for your service or delivery?`] },
  { id: "phone_contact", answerType: "contact", knowledgeKeys: ["business.phone"], question: c => `What phone number should customers use to contact your ${c.businessLabel}?`, variants: () => [`What is your contact number?`, `Which number should the chatbot share?`] },
  { id: "email_contact", answerType: "contact", knowledgeKeys: ["business.email"], question: c => `Which email address can customers use to contact your ${c.businessLabel}?`, variants: () => [`Do you have a customer-support email?`, `Where can customers email their enquiry?`] },
  { id: "human_handoff", answerType: "process", knowledgeKeys: ["business.human_handoff", "business.phone", "business.email"], question: c => `How can a customer reach a real person if the chatbot cannot answer?`, variants: c => [`Who should customers contact for help with your ${c.businessLabel}?`, `What is the approved human-support route?`] },
  { id: "exact_price", answerType: "money", knowledgeKeys: ["offerings.prices"], question: c => `What verified prices may the chatbot quote for your ${c.offeringsLabel}?`, variants: c => [`Where are the current prices for your ${c.offeringsLabel} listed?`, `Which prices can the chatbot safely tell customers?`] },
  { id: "price_range", answerType: "money", knowledgeKeys: ["offerings.price_range"], question: c => `Are there approved price ranges for your ${c.offeringsLabel}?`, variants: c => [`What budget range should customers expect?`, `Can the chatbot share a starting price or estimate?`] },
  { id: "additional_fees", answerType: "money", knowledgeKeys: ["policies.extra_fees"], question: c => `Are there any extra fees, taxes, delivery charges, or service charges customers should know about?`, variants: () => [`What additional charges may apply?`, `Are quoted prices inclusive of all mandatory fees?`] },
  { id: "availability", answerType: "boolean", knowledgeKeys: ["offerings.availability_policy"], question: c => `How should customers check current availability for your ${c.offeringsLabel}?`, variants: c => [`How do customers know whether ${c.offeringsLabel} are available?`, `Which availability details can the chatbot confirm?`] },
  { id: "booking", answerType: "boolean", knowledgeKeys: ["booking.supported", "booking.policy"], question: c => `Can customers make a ${c.bookingLabel} with your ${c.businessLabel}?`, variants: c => [`Do you accept ${c.bookingLabel}s?`, `Can customers reserve or schedule in advance?`] },
  { id: "booking_steps", answerType: "process", knowledgeKeys: ["booking.steps"], question: c => `How does a customer ${c.bookingAction}, step by step?`, variants: c => [`What is the correct booking process for a ${c.bookingLabel}?`, `Which details should customers provide when booking?`] },
  { id: "reschedule", answerType: "policy", knowledgeKeys: ["booking.reschedule_policy"], question: c => `How can customers change the time or details of a ${c.bookingLabel}?`, variants: c => [`Can an existing ${c.bookingLabel} be rescheduled?`, `What should customers do to update a booking?`] },
  { id: "cancellation_refunds", answerType: "policy", knowledgeKeys: ["policies.cancellation", "policies.refund"], question: c => `What are the approved cancellation and refund rules for a ${c.bookingLabel} or purchase?`, variants: c => [`Can customers cancel and receive a refund?`, `Which cancellation deadlines and refund conditions apply?`] },
  { id: "payment_methods", answerType: "list", knowledgeKeys: ["payments.methods", "payments.terms"], question: c => `Which payment methods and payment terms do you accept for your ${c.offeringsLabel}?`, variants: () => [`Can customers pay by cash, card, or digital payment?`, `When is payment due and which methods are supported?`] },
  { id: "fulfillment", answerType: "list", knowledgeKeys: ["fulfillment.options", "fulfillment.policy"], question: c => `How do customers receive your ${c.offeringsLabel}: ${c.fulfillmentLabel}?`, variants: c => [`Do you provide delivery, pickup, online access, or in-person service?`, `What fulfillment options can the chatbot confirm?`] },
  { id: "timelines", answerType: "duration", knowledgeKeys: ["fulfillment.timeline", "booking.timeline"], question: c => `How long should customers expect a ${c.bookingLabel} or service to take?`, variants: c => [`What is the usual completion or delivery time?`, `Are there confirmed wait times or turnaround estimates?`] },
  { id: "customization", answerType: "boolean", knowledgeKeys: ["offerings.customization_policy"], question: c => `Can customers request customized ${c.offeringsLabel}?`, variants: c => [`Do you support special or personalized options?`, `Which custom requests can you approve?`] },
  { id: "discounts", answerType: "policy", knowledgeKeys: ["offers.approved_promotions"], question: c => `Which current discounts or offers, if any, may the chatbot mention for your ${c.offeringsLabel}?`, variants: () => [`Are there any active promotions?`, `Which offers are valid and what conditions apply?`] },
  { id: "eligibility", answerType: "policy", knowledgeKeys: ["policies.eligibility", "policies.required_documents"], question: c => `Are there any eligibility rules, age limits, or documents required before customers use your ${c.offeringsLabel}?`, variants: c => [`Who can use or book these services?`, `What should a customer prepare before proceeding?`] },
  { id: "quote", answerType: "process", knowledgeKeys: ["pricing.quote_policy", "pricing.quote_requirements"], question: c => `Can customers request a quote for your ${c.offeringsLabel}, and what details do you need?`, variants: c => [`How do you estimate the price for a customer?`, `What information is required before giving a quote?`] },
  { id: "tracking", answerType: "process", knowledgeKeys: ["orders.tracking", "booking.status_check"], question: c => `How can customers check the status of an order or ${c.bookingLabel}?`, variants: () => [`Can customers track a request after submitting it?`, `Where should customers ask for a status update?`] },
  { id: "complaints", answerType: "process", knowledgeKeys: ["support.complaints"], question: c => `How should customers raise a complaint or report a problem with your ${c.businessLabel}?`, variants: () => [`Where can a customer submit a complaint?`, `What happens after a complaint is received?`] },
  { id: "warranty_guarantee", answerType: "policy", knowledgeKeys: ["policies.warranty", "policies.guarantee"], question: c => `Do any of your ${c.offeringsLabel} include a warranty, guarantee, or after-service support?`, variants: () => [`What support is available after purchase or service?`, `Which warranty terms are confirmed?`] },
  { id: "accessibility", answerType: "list", knowledgeKeys: ["business.accessibility"], question: c => `What accessibility accommodations or customer assistance do you provide?`, variants: () => [`Can customers with accessibility needs get assistance?`, `Are accessible facilities or support options available?`] },
  { id: "restrictions", answerType: "policy", knowledgeKeys: ["policies.restrictions", "policies.exclusions"], question: c => `Are there restrictions, exclusions, or important conditions customers should know before choosing your ${c.offeringsLabel}?`, variants: () => [`What limitations or exclusions apply?`, `Are there important terms the chatbot must always disclose?`] },
  { id: "invoice_receipt", answerType: "process", knowledgeKeys: ["payments.invoice_policy"], question: c => `How can customers receive an invoice, receipt, or payment confirmation?`, variants: () => [`Do you provide receipts or invoices?`, `What proof of payment can a customer request?`] },
  { id: "online_support", answerType: "boolean", knowledgeKeys: ["fulfillment.online_options", "support.online_channels"], question: c => `Which ${c.offeringsLabel} or support services can customers access online or remotely?`, variants: () => [`Can customers complete the process online?`, `Which online channels do you officially support?`] },
  { id: "privacy", answerType: "policy", knowledgeKeys: ["policies.privacy", "policies.data_handling"], question: c => `What approved privacy and personal-data information should the chatbot share with customers?`, variants: () => [`How is customer information handled?`, `What privacy policy or data-use notice should be linked?`] },
  { id: "language_support", answerType: "list", knowledgeKeys: ["assistant.supported_languages", "assistant.language_policy"], question: c => `Which languages should your ${c.businessLabel} chatbot support for customers?`, variants: () => [`Should the chatbot answer in English, Telugu, Hindi, or other languages?`, `Are there languages the chatbot should recognize or hand off to a person?`] },
  { id: "special_requests", answerType: "process", knowledgeKeys: ["policies.special_requests"], question: c => `Can customers make special requests, and how are they reviewed or approved?`, variants: () => [`How should a customer ask for an exception?`, `Which special requests must be confirmed by a person?`] },
  { id: "next_steps", answerType: "process", knowledgeKeys: ["business.next_steps"], question: c => `What should a customer do next if they want to proceed with your ${c.offeringsLabel}?`, variants: c => [`How can an interested customer get started?`, `What is the next step after getting the required information?`] },
];

export const QUESTION_BANK_VERSION = "2026-10-24.1";
export const QUESTION_BANK: readonly QuestionPattern[] = Object.freeze(
  CATEGORIES.flatMap(category => INTENTS.map(intent => ({
    id: `${category.id}.${intent.id}`,
    category: category.id,
    intent: intent.id,
    question: intent.question(category),
    variants: Object.freeze([...intent.variants(category)]),
    knowledgeKeys: Object.freeze([...intent.knowledgeKeys]),
    answerType: intent.answerType,
    requirement: category.mandatoryIntents.includes(intent.id) ? "mandatory" as const : "optional" as const,
  }))),
);

export function listBusinessCategories(): Array<{ id: BusinessCategoryId; label: string }> {
  return CATEGORIES.map(({ id, label }) => ({ id, label }));
}

export function getQuestionBank(category?: BusinessCategoryId): QuestionPattern[] {
  return QUESTION_BANK.filter(pattern => !category || pattern.category === category).map(pattern => ({
    ...pattern,
    variants: [...pattern.variants],
    knowledgeKeys: [...pattern.knowledgeKeys],
  }));
}

/** Select relevant patterns and collapse repeat intents when a business has multiple category tags. */
export function selectQuestionPatterns(categories: readonly BusinessCategoryId[]): QuestionPattern[] {
  const selected = categories.flatMap(category =>
    QUESTION_BANK.filter(pattern => pattern.category === category)
  );
  const seenIntents = new Set<string>();
  const seenQuestions = new Set<string>();
  const result: QuestionPattern[] = [];
  for (const pattern of selected) {
    const questionKey = normalizeQuestionText(pattern.question);
    if (seenIntents.has(pattern.intent) || seenQuestions.has(questionKey)) continue;
    seenIntents.add(pattern.intent);
    seenQuestions.add(questionKey);
    result.push({ ...pattern, variants: [...pattern.variants], knowledgeKeys: [...pattern.knowledgeKeys] });
  }
  return result;
}

export function normalizeQuestionText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function deduplicateQuestionPatterns(patterns: readonly QuestionPattern[]): QuestionPattern[] {
  const seenIds = new Set<string>();
  const seenIntents = new Set<string>();
  const seenQuestions = new Set<string>();
  const result: QuestionPattern[] = [];
  for (const pattern of patterns) {
    const normalized = normalizeQuestionText(pattern.question);
    if (seenIds.has(pattern.id) || seenIntents.has(pattern.intent) || !normalized || seenQuestions.has(normalized)) continue;
    seenIds.add(pattern.id);
    seenIntents.add(pattern.intent);
    seenQuestions.add(normalized);
    result.push({ ...pattern, variants: [...pattern.variants], knowledgeKeys: [...pattern.knowledgeKeys] });
  }
  return result;
}
