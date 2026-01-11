# Visual Verification Checklist ✅

## Open the App
URL: **http://localhost:5173**

---

## Test 1: Type "roland" (Prediction Phase)

### Ghost Card Should Show:
- [ ] **Real drum kit image** (not just letter "R")
- [ ] **Roland logo** in top-left corner (white circle)
- [ ] **Product name:** "Roland TD-17KVX Gen 2"
- [ ] **Production badge:** "Made in Malaysia 🇲🇾" (purple/indigo)
- [ ] **Brand HQ:** "Roland Corporation: Hamamatsu, Japan 🇯🇵" (small text below)
- [ ] **Smooth animation** on appearance (scale + fade)
- [ ] **Pulsing indicator** in top-right (green dot)

### Related Items at Bottom Should Show:
- [ ] 6 cards in horizontal scroll
- [ ] Each card has **real product image** (not emoji)
- [ ] Card names: RH-300, NE-10, DAP-3X, TD-17KV, TD-27KV, PD-120
- [ ] Each shows category and type badge

---

## Test 2: Press Enter (Lock Product)

### ChatView Product Header Should Show:
- [ ] **Roland logo** (clickable circle on left)
- [ ] **Product name:** "Roland TD-17KVX Gen 2"
- [ ] **Production badge:** "Made in Malaysia 🇲🇾"
- [ ] **Brand HQ:** "Hamamatsu, Japan 🇯🇵" (gray text)
- [ ] Glassmorphism background (semi-transparent)

### Status Messages Should Show:
- [ ] "[STATUS] Reading Official Manual..."
- [ ] "[STATUS] Analyzing content..."
- [ ] "[STATUS] Thinking..."
- [ ] Green text, uppercase, with border

---

## Test 3: Ask "How do I connect Bluetooth?"

### Answer Should Start With:
```
This product is from Roland Corporation (Hamamatsu, Japan 🇯🇵) 
and is manufactured in Malaysia 🇲🇾.
```

### Answer Should Include:
- [ ] **First sentence mentions brand HQ and production country**
- [ ] Technical instructions about Bluetooth
- [ ] Mention of at least one related product:
  - "Roland RH-300" OR
  - "Roland NE-10" (Noise Eater)
- [ ] Product names appear as **blue underlined clickable text**

### Bottom of Answer Should Show:
- [ ] **Source badge:** "📖 Answered from Official Manual"
- [ ] Small text, gray, with book emoji

### Related Items Rail Should Show:
- [ ] 6 cards at bottom with real images
- [ ] Each card shows production country (e.g., "China 🇨🇳")
- [ ] Hover effect on cards (blue glow)
- [ ] All images loaded (no broken images)

---

## Test 4: Click on "Roland RH-300" in Answer Text

### Should Navigate To:
- [ ] New Ghost Card with RH-300 headphones image
- [ ] Production badge: "Made in China 🇨🇳"
- [ ] Brand HQ still shows Japan
- [ ] Page doesn't reload, just updates content
- [ ] Can ask new questions about headphones

---

## Test 5: Click Brand Logo

### Brand Modal Should Show:
- [ ] Roland Corporation logo (large)
- [ ] HQ: "Hamamatsu, Japan 🇯🇵"
- [ ] Founded: 1972
- [ ] Company description
- [ ] "Official Website" link (clickable)
- [ ] Can close modal (X button or click outside)

---

## Common Issues to Check

### Images Not Loading?
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "Img"
4. Check if requests to `static.roland.com` are successful
5. If CORS errors, check console

### No Brand/Production Context?
1. Check browser console for errors
2. Verify answer starts with brand info
3. If missing, backend LLM service may not be working

### Related Products Not Clickable?
1. Check if text is blue and underlined
2. Try hovering - should show pointer cursor
3. Check browser console for errors

### Related Items Show Emoji Instead of Images?
1. Check Network tab for failed image requests
2. Verify `item.image` URLs in DevTools
3. Backend may not be including images in response

---

## Screenshot Checklist 📸

Take screenshots of:
1. **Ghost Card** with product image and badges
2. **ChatView** with product header showing brand logo
3. **Answer text** with brand/production context in first sentence
4. **Related Items Rail** with images and production countries
5. **Brand Modal** with logo and company info

---

## Success Criteria ✨

| Feature | Expected | Status |
|---------|----------|--------|
| Product images | Real Roland images from CDN | ⬜ |
| Brand logos | Roland logo visible everywhere | ⬜ |
| Production badges | Shows country with flag | ⬜ |
| Brand HQ | Japan flag visible | ⬜ |
| Answer starts with context | "This product is from..." | ⬜ |
| Related products clickable | Blue underlined links | ⬜ |
| Related items have images | Real product photos | ⬜ |
| Related items show origin | Production country visible | ⬜ |
| Source badge | "Answered from Manual" | ⬜ |
| Navigation works | Click products to switch | ⬜ |

---

## If Everything Works 🎉

You should see:
- **Real product images everywhere** (not placeholders)
- **Flags for countries** (🇯🇵 🇲🇾 🇨🇳)
- **Brand context in every answer**
- **Clickable product names** (hyperlinks)
- **Professional glassmorphism UI**
- **Smooth animations and transitions**

---

## Demo Ready! 🚀

If all checkboxes are ✅, the system is ready for:
- Client presentation
- User testing
- Feature showcase
- Stakeholder demo

---

*Last Updated: January 11, 2026*
*Test on: Chrome, Firefox, Safari*
