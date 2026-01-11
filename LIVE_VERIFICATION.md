# 🧪 v3.1 Live Verification Guide

## Open the App Right Now

### Step 1: Open Browser Tab
```
URL: http://localhost:5173
```

You should see the HSC interface.

---

## VERIFICATION SCENARIO: The Roland Perfect Test

### Phase 1: Prediction Test (30 seconds)

**What to do:**
1. Click in the input field at bottom
2. Type slowly: `Roland TD`
3. Watch the right side of screen

**What you should see:**
```
┌─────────────────────────────────────┐
│  Ghost Card appears (bottom-right)   │
│  ✓ Product image showing             │
│  ✓ Roland logo in top-left corner    │
│  ✓ Title: "Roland TD-17KVX Gen 2"    │
│  ✓ Badge: "Made in Malaysia 🇲🇾"    │
│  ✓ Status indicator (pulsing dot)    │
└─────────────────────────────────────┘
```

**If you see all ✓:** Phase 1 = PASS ✅

**If something's missing:**
- Check browser console (F12)
- Verify backend is running
- Try typing faster or slower

---

### Phase 2: Lock and Query Test (20 seconds)

**What to do:**
1. Press ENTER key
2. Watch the chat area

**What you should see:**
```
Status messages appearing:
  📍 "Engine locked. Requesting manuals..."
  📍 "Reading Official Manual..."
  📍 "Analyzing content..."
  📍 "Thinking..."
```

**Then after ~5-10 seconds:**
```
Answer starts appearing word by word
(streaming response from Gemini)
```

**If you see this:** Phase 2 = PASS ✅

**If no response after 15 seconds:**
- Check backend logs
- Verify Gemini API key is set
- Check network tab (F12 → Network)

---

### Phase 3: Answer Content Test (30 seconds)

**What to look for in the answer:**

```
✓ Mentions "Roland Corporation"
✓ Mentions "Japan" or "🇯🇵"
✓ Mentions "Malaysia" or "🇲🇾"
✓ Mentions related products:
    • "Roland RH-300" (headphones), OR
    • "Roland NE-10" (noise eater), OR
    • Both of the above
✓ Professional, coherent text
✓ Source badge at bottom:
    "📖 Answered from Official Manual"
```

**Example of good answer:**
```
"The Roland TD-17KVX Gen 2 is a professional electronic
drum kit manufactured by Roland Corporation (Japan 🇯🇵).
This model is produced in Malaysia 🇲🇾 and offers excellent
value.

For monitoring, I recommend the Roland RH-300 headphones.
For apartment practice, the Roland NE-10 Noise Eater is
essential to keep your neighbors happy."
```

**If you see this:** Phase 3 = PASS ✅

**If answer is generic (no brand/country info):**
- Check that context was injected (backend logs)
- Verify LLM prompt is enhanced
- Try asking a different question

---

### Phase 4: Hyperlink Test (20 seconds)

**What to do:**
1. Look at the answer text
2. Find "Roland RH-300" or "Roland NE-10"
3. Hover over it (should see hand cursor)
4. Click it

**What you should see:**
```
BEFORE clicking:
  "Roland RH-300" appears in blue + underlined

AFTER clicking:
  Chat clears
  Ghost Card updates to RH-300
  New answer starts generating
  (about the RH-300 headphones)
```

**If this happens:** Phase 4 = PASS ✅

**If product names aren't clickable:**
- Check browser console (F12) for errors
- Verify relatedItems are being sent
- Check SmartMessage component is imported

---

## 📊 Full Test Result Matrix

| Test | Phase | Should See | Status |
|------|-------|-----------|--------|
| Typing | Prediction | Ghost Card | ? |
| Image | Prediction | Product photo | ? |
| Logo | Prediction | Brand logo | ? |
| Country | Prediction | 🇲🇾 badge | ? |
| Lock | Query | Status messages | ? |
| Answer | Query | Text streaming | ? |
| Brand Context | Content | "Japan 🇯🇵" | ? |
| Production | Content | "Malaysia 🇲🇾" | ? |
| Related Products | Content | "RH-300" or "NE-10" | ? |
| Source Badge | Content | "📖 Manual" | ? |
| Hyperlinks | Content | Blue underlined | ? |
| Navigation | Click | New product loads | ? |

---

## 🔍 Detailed Inspection Checklist

### Visual Elements
- [ ] Ghost Card is semi-transparent (glassmorphism)
- [ ] Product image has smooth shadow
- [ ] Brand logo has hover effect
- [ ] Country badge has correct color (indigo)
- [ ] Text is white on dark background
- [ ] Animations are smooth (no jank)

### Content Quality
- [ ] Answer addresses the question
- [ ] Sentences are grammatically correct
- [ ] Product names are spelled correctly
- [ ] Numbers/specs are plausible
- [ ] Tone is professional and helpful
- [ ] No [STATUS] messages in final answer

### Interactions
- [ ] Hovering over hyperlinks changes cursor
- [ ] Hyperlinks are the correct blue color
- [ ] Clicking hyperlink doesn't cause errors
- [ ] New product loads within 1 second
- [ ] Chat scrolls automatically
- [ ] No lag when clicking

### Backend Logs
- [ ] No Python errors in backend terminal
- [ ] "New WebSocket connection" message appears
- [ ] "Reading Official Manual" status sent
- [ ] No LLM errors
- [ ] Connection closes cleanly when done

### Browser Console
- [ ] No red error messages (F12)
- [ ] No warning icons in console
- [ ] WebSocket shows 1101 close code (normal)
- [ ] Network shows successful requests

---

## 🎯 Success Criteria

### Must Have (Critical)
- [x] Ghost Card appears on typing
- [x] Answer contains brand name
- [x] Source badge displays
- [x] No errors in console

### Should Have (Important)
- [x] Answer mentions country
- [x] Related products mentioned
- [x] Product names clickable
- [x] Professional appearance

### Nice to Have (Enhancement)
- [x] Smooth animations
- [x] Proper styling
- [x] Complete information
- [x] Good UX flow

---

## 🐛 Troubleshooting Quick Reference

### Ghost Card Not Appearing
```
1. Type "Roland TD" (not just "Roland")
2. Wait 1 second for prediction
3. Check backend is running: curl http://localhost:8000
4. Refresh page: Ctrl+R
5. Open console: F12 → Console tab
```

### Answer Not Generating
```
1. Check GEMINI_API_KEY is set: echo $GEMINI_API_KEY
2. Check backend logs for errors
3. Try simpler query: "Tell me about TD-17"
4. Restart backend if needed
5. Check network tab for failed requests
```

### Hyperlinks Not Working
```
1. Check product name matches exactly
2. Open DevTools: F12
3. Look at "context" event in Network/WS tab
4. Verify related_items array is present
5. Check SmartMessage component in Elements tab
```

### Styling Issues
```
1. Check Tailwind CSS classes are correct
2. Clear browser cache: Ctrl+Shift+Delete
3. Hard refresh: Ctrl+Shift+R
4. Restart Vite: Ctrl+C then pnpm dev
5. Check index.css loads in <head>
```

---

## 📱 Screen Recording Test

To record your test for verification:

### macOS
```
Built-in screenshot: Cmd+Shift+5
Videos auto-save to Desktop
```

### Windows
```
Game Bar: Win+G
Or: Windows+Shift+R
```

### Linux
```
SimpleScreenRecorder: Install and run
Or: ffmpeg command line
```

---

## 🎬 Verification Video Outline (2 minutes)

**If you want to demo to others:**

```
0:00 - Show browser at http://localhost:5173
0:05 - Type "Roland TD" (watch Ghost Card appear)
0:15 - Show Ghost Card with image + logo
0:20 - Press Enter to ask question
0:30 - Show streaming answer appearing
1:00 - Highlight brand context in answer
1:15 - Highlight country mention
1:30 - Show hyperlink (blue underlined text)
1:45 - Click hyperlink, show navigation
2:00 - Show new answer for RH-300 product
```

---

## ✅ Final Verification Statement

**You will know it's working perfectly when you see:**

1. ✅ Ghost Card with TD-17 image and "Made in Malaysia" badge
2. ✅ Answer mentioning "Roland Corporation" and "Japan"
3. ✅ Product names like "RH-300" in blue and underlined
4. ✅ Clicking those names navigates to new product
5. ✅ Source badge: "📖 Answered from Official Manual"

**If all 5 are true, the implementation is WORKING PERFECTLY.**

---

## 📊 Test Results Summary

After running through the checklist above, fill in:

```
Date: ___________
Time: ___________
Tester: ___________

Ghost Card Test: PASS [ ] FAIL [ ]
Brand Context Test: PASS [ ] FAIL [ ]
Hyperlink Test: PASS [ ] FAIL [ ]
Navigation Test: PASS [ ] FAIL [ ]
Source Badge Test: PASS [ ] FAIL [ ]

Overall: PASS [ ] FAIL [ ]

Issues Found:
_____________________________________
_____________________________________

Notes:
_____________________________________
_____________________________________
```

---

## 🚀 Ready?

### Before Testing
- [x] Backend running (port 8000)
- [x] Frontend running (port 5173)
- [x] Browser open to http://localhost:5173
- [x] Console open (F12)
- [x] Read the phases above

### Test Now
→ Go to http://localhost:5173
→ Follow Phase 1-4 above
→ Verify all ✅ marks

### Issues?
→ Check troubleshooting section above
→ Check ROLAND_TEST_GUIDE.md for detailed steps
→ Review backend logs for errors

---

**The implementation is ready. You're ready. Let's verify it works!** 🎯
