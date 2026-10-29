// Business types that have a ready-made question bank in botcraft-banks/.
// BotCraft maps whatever the owner says ("shoe shop", "chappal shop") to one
// of these keys, so every owner of the same type reuses the same bank.
// To add a type: add it here, then run scripts/generate-botcraft-banks.mjs.

export const SHOP_TYPES = [
  { key: "restaurant", name: "Restaurant", aliases: ["hotel (food)", "dhaba", "family restaurant", "biryani point", "mess", "meals hotel", "cafe", "bar and restaurant"], description: "restaurant serving dine-in, takeaway and parcels" },
  { key: "fast_food", name: "Fast food centre", aliases: ["fast food", "burger shop", "pizza shop", "chinese fast food", "momos stall", "shawarma", "rolls and frankies", "food truck", "snacks corner"], description: "fast food centre selling burgers, pizza, rolls, momos and Indo-Chinese" },
  { key: "tiffin_centre", name: "Tiffin centre", aliases: ["tiffin hotel", "tiffins", "idli dosa centre", "breakfast centre", "tiffin bandi", "darshini", "udupi hotel"], description: "tiffin centre serving idli, dosa, vada and other South Indian tiffins" },
  { key: "catering", name: "Catering service", aliases: ["caterers", "wedding catering", "event catering", "function catering", "outdoor catering", "home catering", "cloud kitchen for events"], description: "catering service cooking for weddings, functions and events" },
  { key: "jewellery", name: "Gold & diamond jewellery shop", aliases: ["jewellers", "gold shop", "silver shop", "diamond shop", "bullion"], description: "jewellery shop selling gold, silver and diamond jewellery" },
  { key: "imitation_jewellery", name: "One-gram gold & imitation jewellery shop", aliases: ["one gram gold", "imitation jewellery", "fashion jewellery", "covering jewellery", "artificial jewellery", "bangle store"], description: "one-gram gold and imitation jewellery shop" },
  { key: "saree_textiles", name: "Saree & textile showroom", aliases: ["saree shop", "textiles", "silk house", "pattu sarees", "handloom", "cloth store", "shopping mall (textiles)", "dress materials"], description: "saree and textile showroom selling silk and cotton sarees, dress materials and wedding clothes" },
  { key: "readymade_garments", name: "Readymade garments / family fashion store", aliases: ["readymade", "garments", "clothing store", "men's wear", "ladies wear", "fashion store", "family store", "jeans shop", "kurti shop"], description: "readymade garments store selling clothes for men, women and kids" },
  { key: "boutique", name: "Boutique & designer wear", aliases: ["boutique", "designer studio", "ladies tailor", "tailoring shop", "maggam work", "aari work", "bridal blouse designer", "fashion designer"], description: "boutique making designer blouses, bridal wear and custom-stitched dresses" },
  { key: "kids_wear", name: "Kids wear shop", aliases: ["kids wear", "baby shop", "children's clothes", "baby clothes", "kids fashion"], description: "kids wear shop selling clothes for babies and children" },
  { key: "footwear", name: "Footwear shop", aliases: ["shoe shop", "chappal shop", "sandals", "slippers", "sports shoes"], description: "footwear shop selling shoes, sandals and chappals for men, women and kids" },
  { key: "mobile_shop", name: "Mobile shop", aliases: ["mobile store", "cell phone shop", "smartphone shop", "mobile accessories", "mobile repair shop", "iPhone store"], description: "mobile phone shop selling phones, accessories and repairs" },
  { key: "appliances_showroom", name: "Electronics & home appliances showroom", aliases: ["electronics showroom", "TV showroom", "home appliances", "AC showroom", "refrigerator and washing machine shop", "electronics store"], description: "electronics and home appliances showroom selling TVs, fridges, washing machines and ACs" },
  { key: "computer_shop", name: "Computer & laptop shop", aliases: ["laptop shop", "computer store", "computer sales and service", "printer shop", "CCTV shop", "IT store"], description: "computer and laptop shop selling laptops, desktops, printers and accessories with service" },
  { key: "electrical_hardware", name: "Electrical & hardware shop", aliases: ["electrical shop", "hardware store", "plumbing", "sanitary", "paints", "tools"], description: "electrical, hardware, plumbing and paint supplies shop" },
  { key: "grocery", name: "Grocery / supermarket", aliases: ["kirana", "general store", "supermarket", "provision store", "departmental store", "vegetables and fruits"], description: "grocery, kirana and supermarket store" },
  { key: "bakery_sweets", name: "Bakery & sweet shop", aliases: ["bakery", "sweet shop", "cake shop", "mithai", "snacks"], description: "bakery and sweet shop selling cakes, sweets and snacks" },
  { key: "furniture", name: "Furniture shop", aliases: ["furniture showroom", "mattress", "home decor", "interiors"], description: "furniture and home furnishing shop" },
  { key: "salon", name: "Hair salon / barber shop", aliases: ["salon", "barber shop", "hair cutting saloon", "men's salon", "unisex salon", "hair studio", "gents parlour"], description: "hair salon or barber shop for men and unisex customers" },
  { key: "beauty_parlour", name: "Ladies beauty parlour & bridal makeup", aliases: ["beauty parlour", "ladies parlour", "beauty salon", "bridal makeup studio", "makeup artist", "mehendi", "nail studio"], description: "ladies beauty parlour offering facials, waxing, hair and bridal makeup" },
  { key: "spa", name: "Spa & massage centre", aliases: ["spa", "massage centre", "wellness centre", "ayurvedic massage", "body massage", "thai spa", "foot reflexology"], description: "spa and massage centre offering body massages and wellness treatments" },
  { key: "pharmacy", name: "Pharmacy / medical store", aliases: ["medical shop", "chemist", "medicine shop", "druggist"], description: "pharmacy and medical store selling medicines and health products" },
  { key: "optical", name: "Optical shop", aliases: ["opticals", "spectacles", "eye wear", "sunglasses", "contact lenses"], description: "optical shop selling spectacles, frames, lenses and sunglasses" }
];

export const SHOP_TYPE_KEYS = new Set(SHOP_TYPES.map(t => t.key));
