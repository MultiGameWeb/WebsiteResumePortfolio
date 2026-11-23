# Test data: an electronics shop (all details are made up)

Use this to try the BotCraft setup chat as a shop owner. Names, numbers and prices are dummy. Replace the phone numbers with your own if you want to test Call and WhatsApp.

## 1. First message (the shop type)
```
I have an electronics showroom. I sell mobiles, laptops, refrigerators, TVs and accessories.
```

## 2. Basic questions (answer in the form, or paste this as one message)
```
Shop name: Sri Balaji Electronics
Owner name: Ravi Kumar
Address: Shop 14, Main Road, Near Bus Stand, Kukatpally, Hyderabad 500072
Area: City
Google Maps link: https://maps.google.com/?q=Kukatpally+Hyderabad
Parking: Yes, free parking for bikes and cars in front of the shop
Timings: 10:00 AM to 9:00 PM
Weekly holiday: No holiday, open all 7 days
Phone: 9000000001
WhatsApp: 9000000001
Main items: Mobiles, laptops, refrigerators, TVs and accessories
Exchange / return: Old phones and TVs can be exchanged on a new purchase. A defective product is replaced within 7 days with the bill and box.
Home delivery: Yes. Free within 10 km for bills above Rs 10,000. Same day for TVs and fridges.
EMI: Yes, on some items (bills above Rs 10,000)
EMI options: Bajaj Finserv EMI card, credit card EMI, HDFC debit card EMI
Zero down payment: On some products
EMI documents: Aadhaar card, PAN card, bank passbook or cancelled cheque, one passport photo
Offers: Diwali offer: Rs 2,000 off on TVs of 43 inch and above. Free tempered glass with every mobile. Exchange bonus of Rs 1,500 on old phones.
Wi-Fi: skip
```

## 3. Items and prices (send as one message; they become item cards)
```
MOBILES
Samsung Galaxy M35 5G 8GB/128GB - Rs 17,999 - 6000 mAh battery, 50 MP camera, 1 year warranty
Redmi Note 13 Pro 5G 8GB/256GB - Rs 24,999 - 200 MP camera, AMOLED display
iPhone 15 128GB - Rs 64,900 - A16 chip, 48 MP camera, 1 year Apple warranty
OnePlus Nord CE4 8GB/128GB - Rs 24,999 - 100W fast charging
realme Narzo 70x 5G 4GB/128GB - Rs 10,999 - 5000 mAh battery

LAPTOPS
HP 15s Core i5 12th Gen 16GB/512GB SSD - Rs 52,990 - 15.6 inch, Windows 11, 1 year warranty
Lenovo IdeaPad Slim 3 Ryzen 5 8GB/512GB - Rs 38,990 - 15.6 inch FHD
Dell Inspiron 15 Core i3 8GB/512GB - Rs 36,490 - Windows 11, Office included
Apple MacBook Air M2 13 inch 8GB/256GB - Rs 89,900 - 18 hour battery

REFRIGERATORS
LG 242 L Double Door 3 Star Frost Free - Rs 26,490 - Smart inverter, 10 years compressor warranty
Samsung 236 L Double Door 3 Star - Rs 24,990 - Digital inverter
Whirlpool 190 L Single Door 4 Star Direct Cool - Rs 14,490 - Low power use

TVs
Sony Bravia 43 inch 4K Google TV - Rs 44,990 - Dolby Audio, 2 year warranty
Samsung 55 inch Crystal 4K Smart TV - Rs 49,990 - Alexa built in
LG 32 inch HD Ready Smart TV - Rs 13,990 - WebOS
Mi 40 inch Full HD Smart TV - Rs 20,999 - Android TV

ACCESSORIES
boAt Airdopes 141 earbuds - Rs 1,299
Samsung 25W fast charger - Rs 1,199
Tempered glass (any phone) - Rs 199
Mobile back cover - Rs 299
Wireless mouse - Rs 499
Power bank 20000 mAh - Rs 1,799
Laptop bag 15.6 inch - Rs 799
HDMI cable 2 metre - Rs 349
```

## 4. Shop questions from the question list (short answers)
```
Brands: Samsung, Apple, Xiaomi, OnePlus, realme, HP, Dell, Lenovo, Sony, LG, Whirlpool
Products are brand new, sealed and original with the company warranty: Yes
GST bill for every product: Yes
Product dead on arrival: replaced within 7 days
Refurbished or second-hand: No, we sell only new products
New launches: Pre-booking is open for new phones
Out of stock models: 2 to 4 days
Prices: MRP is fixed, but we give exchange and festival offers
Online price match: Yes, we try to match Amazon and Flipkart on request
Demo pieces: Yes for TVs and laptops
Product opened and checked in front of the customer: Yes
Installation: Free for TVs and fridges
Delivery and installation: same day inside the city
Extended warranty: Yes, 1 extra year at 8 percent of the price
New stock arrives: every Tuesday and Friday
Advance booking: Yes, Rs 1,000 advance
```

## 5. Photos to send
Send two or three real photos from your phone, such as a TV, a phone box and the shop front. This tests the photo tidy-up. After the bot is ready, open the owner page and try the sparkle button on an item photo to test the photo studio (needs the Gemini key on the Worker).

## 6. What to try afterwards

**As a customer** (open the customer link or scan the QR):
- "Do you have a Samsung phone under 20000?"
- "55 inch TV price?"
- "Is EMI available on the MacBook?"
- "Can you deliver a fridge to my home?"
- "What time do you open?"
- "Do you exchange old phones?"
- "Is the iPhone 15 available?"
- Tap an item, swipe its photos, use Talk mode.

**As the owner** (owner page, Update with chat; type or use the mic):
- "Samsung 55 inch TV price 47990"
- "iPhone 15 out of stock"
- "Hide MacBook Air"
- "Rename Mi 40 inch TV to Mi 40 inch Full HD TV"
- "Add Realme Buds Air 5 Rs 2,999"
- "Change timings to 10 AM to 10 PM"
- "Hide the map" and then "show the map again"
- "Change shop name to Sri Balaji Electronics and Mobiles"

Stock counts, sales and payment methods are not built yet. Today an item is only in stock, out of stock or hidden.

## 7. Photo prompts for Gemini (made up, for testing)

Each prompt asks for 5 images in one go. If Gemini returns fewer, ask: "Now make the remaining images in the same style." The photos are meant to look like a shop owner took them on a phone, with a normal shop background, so you can test the tidy-up and the AI photo studio. Brand logos are avoided on purpose.

**Shop front (1 image)**
```
A realistic phone photo of the front of a small electronics showroom in an Indian city, daytime. A signboard says "Sri Balaji Electronics" in bold letters, with small pictures of a mobile, TV and fridge. A glass door, TVs visible inside, bikes parked outside. Natural light, slightly imperfect framing like a phone camera. No people.
```

**Template: 5 photos of one product**
```
Make 5 separate realistic phone photos of the same [PRODUCT], as a shop owner would take them inside an electronics showroom with a normal busy background (shelves, other boxes, shop lights). Photo 1: front view. Photo 2: side angle. Photo 3: back or ports view. Photo 4: close-up of the screen or main feature. Photo 5: with its retail box beside it. Same product in every photo. No brand logos, no text overlays, no people.
```
Replace `[PRODUCT]` with one of these:
```
55 inch smart TV on a retail stand, black bezel
```
```
smartphone, 6.7 inch, black, on a glass counter
```
```
15.6 inch laptop, silver, open on a table
```
```
double door refrigerator, 242 litre, steel grey, standing on the showroom floor
```
```
pair of wireless earbuds with a charging case and a 20000 mAh power bank, on a counter
```

**Photos for the other items:** repeat the template with the product name, or use this to get 5 different products in one prompt:
```
Make 5 separate realistic phone photos, one image per product, each taken in an electronics showroom with a normal busy background: (1) a smartphone box and phone, (2) a laptop, (3) a single door refrigerator, (4) a 32 inch TV, (5) a fast charger and a tempered glass pack. No brand logos, no text overlays, no people.
```

**Tips**
- Save the photos with the item name, for example `tv-55-front.jpg`, so it is easy to match them.
- Send the shop front photo in the setup chat. Add item photos from the owner page: open the item and use "+ Add photo" (up to 5 per item).
- A photo with a messy background is the right test for the ✨ photo studio.
