# Roland MVP Test Guide 🎯

## ✅ Pre-Test Checklist

- [x] Backend running on port 8000
- [x] Frontend running on http://localhost:5173
- [x] Roland catalog updated with real image URLs
- [x] LLM prompt enhanced to always mention brand HQ & production country
- [x] UI components updated to display images and badges

---

## 🎬 Test Scenario: "The Perfect Roland Demo"

### Step 1: Visual Prediction (Ghost Card)

**Action:** Type slowly: `roland`

**Expected Results:**
- Ghost Card appears on bottom-right
- **Roland logo** visible in corner (clickable)
- **Product image** displayed (TD-17KVX Gen 2 drum kit)
- **Production badge** shows: "Made in Malaysia 🇲🇾"
- Product ID: `roland-td17kvx2`
- Brand info: "Roland Corporation: Hamamatsu, Japan 🇯🇵"

**Visual Verification:**
- ✅ Real product image (not placeholder letter)
- ✅ Roland logo in top-left corner
- ✅ Production country badge visible
- ✅ Brand HQ location shown
- ✅ Smooth animation on appearance

---

### Step 2: Locking the Product

**Action:** Press Enter or click Send

**Expected Results:**
- Ghost Card remains visible
- Status changes to "LOCKED"
- ChatView appears with product header
- Product context header shows:
  - Brand logo (clickable)
  - Product name: "Roland TD-17KVX Gen 2"
  - Production badge: "Made in Malaysia 🇲🇾"
  - Brand HQ: "Hamamatsu, Japan 🇯🇵"

**Visual Verification:**
- ✅ Product header displays all info
- ✅ Brand logo is clickable
- ✅ Production country badge visible

---

### Step 3: Asking a Question

**Action:** Ask: `How do I connect Bluetooth audio to this drum kit?`

**Expected Results:**

#### 3a. Status Messages
- [STATUS] "Reading Official Manual..."
- [STATUS] "Analyzing content..."
- [STATUS] "Thinking..."

#### 3b. Answer Content
**First sentence should ALWAYS include:**
> "This product is from Roland Corporation (Hamamatsu, Japan 🇯🇵) and is manufactured in Malaysia 🇲🇾."

**Then technical answer:**
- Bluetooth connection instructions from manual
- Step-by-step guidance
- May mention related products like:
  - "Roland RH-300" (headphones) - **clickable**
  - "Roland NE-10" (Noise Eater) - **clickable**

#### 3c. Related Items Rail (Bottom)
- Horizontal scrollable cards at bottom
- Shows related products:
  - Roland RH-300 Headphones
  - Roland NE-10 Noise Eater
  - Roland DAP-3X Accessory Package
  - Roland TD-17KV (related model)
  - Roland TD-27KV (upgraded model)
  - Roland PD-120 (replacement pad)

**Each card shows:**
- ✅ Real product image
- ✅ Product name
- ✅ Category
- ✅ Type badge (Accessory/Related/Spare Part)

#### 3d. Source Badge
At bottom of answer:
> 📖 Answered from Official Manual

**Visual Verification:**
- ✅ Answer starts with brand/production context
- ✅ Related product names are **clickable** (blue underline)
- ✅ Related items rail shows real images
- ✅ Source badge visible
- ✅ All images load properly (no broken images)

---

### Step 4: Navigation Test

**Action:** Click on "Roland RH-300" in the answer text

**Expected Results:**
- Page refreshes with RH-300 as active product
- Ghost Card shows RH-300 headphones
- Product header updates:
  - Name: "Roland RH-300 Headphones"
  - Production badge: "Made in China 🇨🇳"
  - Brand HQ: "Hamamatsu, Japan 🇯🇵"
- Can ask new questions about the headphones

**Visual Verification:**
- ✅ Smooth navigation to new product
- ✅ All context updates correctly
- ✅ Images display properly

---

### Step 5: Brand Modal Test

**Action:** Click the Roland logo in product header or Ghost Card

**Expected Results:**
- Brand modal/card appears
- Shows:
  - Roland Corporation logo
  - HQ: "Hamamatsu, Japan 🇯🇵"
  - Founded: 1972
  - Description of company
  - Link to official website
- Modal can be closed

**Visual Verification:**
- ✅ Brand modal displays properly
- ✅ Logo and all info visible
- ✅ Website link works
- ✅ Modal closes correctly

---

## 🎨 What Makes This "Perfect"

### ✅ Zero Latency Prediction
- Ghost Card appears immediately while typing
- Real product images (not placeholders)
- All metadata visible before asking

### ✅ Rich Context in Answers
- **ALWAYS** mentions brand HQ and production country
- Cites official manual sources
- References related products by name
- Professional, helpful tone

### ✅ Hyperlinked Navigation
- Product names in answers are automatically clickable
- One-click navigation to related products
- Seamless context switching

### ✅ Visual Excellence
- Real product images from Roland's CDN
- Glassmorphism UI with smooth animations
- Production country badges
- Brand logo integration
- Source verification badges

### ✅ Geopolitical Awareness
- Brand HQ with country flag
- Production country with flag
- Transparent about manufacturing origin

---

## 🐛 Troubleshooting

### Images Not Loading
1. Check browser console for CORS errors
2. Verify Roland CDN URLs are accessible:
   - https://static.roland.com/assets/images/logo_roland.svg
   - https://static.roland.com/assets/images/products/gallery/td-17kvx2_top_gal.jpg
3. Check SmartImage component fallback behavior

### No Brand/Production Context in Answer
1. Verify LLM prompt includes: "START YOUR RESPONSE by mentioning..."
2. Check backend logs for context injection
3. Verify catalog has `production_country` field

### Related Products Not Clickable
1. Check SmartMessage component
2. Verify `relatedItems` in WebSocket store
3. Check regex matching in SmartMessage

### Ghost Card Shows Placeholder Letter
1. Verify image URL in catalog JSON
2. Check browser network tab for failed image requests
3. Verify SmartImage component receives src prop

---

## 📊 Success Metrics

| Feature | Status | Notes |
|---------|--------|-------|
| Product images display | ✅ | Real Roland images from CDN |
| Brand logo visible | ✅ | In Ghost Card & product header |
| Production country badge | ✅ | Shows Malaysia/China with flags |
| Brand HQ in context | ✅ | Japan flag visible |
| Answers mention brand/origin | ✅ | First sentence always includes |
| Related products clickable | ✅ | SmartMessage auto-links |
| Related items rail | ✅ | Shows images & metadata |
| Source badge | ✅ | Manual citation visible |
| Brand modal | ✅ | Logo clickable, modal works |
| Navigation | ✅ | Seamless product switching |

---

## 🚀 Demo Script (For Showing Client)

1. **"Watch this - I'll just type 'roland' and the system predicts what I need..."**
   - Type `roland` slowly
   - Point out Ghost Card with image, logo, badges

2. **"Now let me ask a technical question..."**
   - Type: `How do I connect Bluetooth?`
   - Point out status messages streaming

3. **"Notice how it tells me where it's from and where it's made..."**
   - Highlight first sentence with brand/production context
   - Point to badges in header

4. **"And look - it's recommending accessories I can click on..."**
   - Hover over "Roland RH-300" to show it's clickable
   - Click to navigate

5. **"Every product has full context and official manual citations..."**
   - Point to source badge
   - Show related items rail at bottom

6. **"This is the future of Just-In-Time technical support - no searching, no waiting, just instant expert knowledge."**

---

## ✨ Next Steps (Post-MVP)

- [ ] Add PDF manual download link to source badge
- [ ] Show manual page numbers in citations
- [ ] Product comparison feature
- [ ] Voice input for hands-free queries
- [ ] Multi-language support
- [ ] Analytics dashboard for support queries

---

## 🎯 Status: **READY FOR DEMO**

All features implemented and tested. The Roland TD-17KVX Gen 2 serves as the perfect showcase for the system's capabilities.
