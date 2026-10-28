// Business types that have a ready-made question bank in botcraft-banks/.
// BotCraft maps whatever the owner says ("shoe shop", "chappal shop") to one
// of these keys, so every owner of the same type reuses the same bank.
// To add a type: add it here, then run scripts/generate-botcraft-banks.mjs.

export const SHOP_TYPES = [
  { key: "restaurant", name: "Restaurant", aliases: ["hotel (food)", "dhaba", "family restaurant", "biryani point", "mess", "cafe", "fast food", "tiffin centre"], description: "restaurant serving dine-in, takeaway and parcels" },
  { key: "jewellery", name: "Jewellery shop", aliases: ["jewellers", "gold shop", "silver shop", "diamond shop"], description: "jewellery shop selling gold, silver and diamond jewellery" },
  { key: "clothing", name: "Clothing / saree shop", aliases: ["textiles", "saree shop", "garments", "readymade", "boutique", "fashion store", "kids wear"], description: "clothing and textile shop selling sarees, dress materials and readymade garments" },
  { key: "footwear", name: "Footwear shop", aliases: ["shoe shop", "chappal shop", "sandals", "slippers", "sports shoes"], description: "footwear shop selling shoes, sandals and chappals for men, women and kids" },
  { key: "mobile_electronics", name: "Mobile & electronics shop", aliases: ["mobile shop", "cell phone shop", "electronics showroom", "TV and appliances", "laptop shop", "home appliances"], description: "mobile phone, electronics and home appliances shop" },
  { key: "electrical_hardware", name: "Electrical & hardware shop", aliases: ["electrical shop", "hardware store", "plumbing", "sanitary", "paints", "tools"], description: "electrical, hardware, plumbing and paint supplies shop" },
  { key: "grocery", name: "Grocery / supermarket", aliases: ["kirana", "general store", "supermarket", "provision store", "departmental store", "vegetables and fruits"], description: "grocery, kirana and supermarket store" },
  { key: "bakery_sweets", name: "Bakery & sweet shop", aliases: ["bakery", "sweet shop", "cake shop", "mithai", "snacks"], description: "bakery and sweet shop selling cakes, sweets and snacks" },
  { key: "furniture", name: "Furniture shop", aliases: ["furniture showroom", "mattress", "home decor", "interiors"], description: "furniture and home furnishing shop" },
  { key: "salon_beauty", name: "Salon & beauty parlour", aliases: ["salon", "beauty parlour", "barber shop", "spa", "unisex salon", "bridal makeup"], description: "salon and beauty parlour offering hair, skin and grooming services" },
  { key: "pharmacy", name: "Pharmacy / medical store", aliases: ["medical shop", "chemist", "medicine shop", "druggist"], description: "pharmacy and medical store selling medicines and health products" },
  { key: "optical", name: "Optical shop", aliases: ["opticals", "spectacles", "eye wear", "sunglasses", "contact lenses"], description: "optical shop selling spectacles, frames, lenses and sunglasses" }
];

export const SHOP_TYPE_KEYS = new Set(SHOP_TYPES.map(t => t.key));
