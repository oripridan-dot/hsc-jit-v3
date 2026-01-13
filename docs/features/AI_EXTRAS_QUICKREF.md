# AI Extras: Quick Reference Guide

## 🎯 One-Minute Overview

**Three new features just launched:**

| Feature | Icon | Description | File |
|---------|------|-------------|------|
| **Smart Pairing** | 💡 | Suggest accessories based on user question | `SmartMessage.tsx` |
| **Pro Tip** | ⚡ | Field advice & stage warnings | `SmartMessage.tsx` |
| **Scenario Mode** | 🎤 | Switch between Studio/Live/General | `ScenarioToggle.tsx` |

---

## 🔧 Implementation Quick Start

### Frontend Integration
```typescript
// 1. Import ScenarioToggle
import { ScenarioToggle } from './ScenarioToggle';

// 2. Add to your component
<ScenarioToggle />

// 3. SmartMessage handles rest (automatic parsing)
<SmartMessage content={message} relatedItems={items} />

// 4. Query with scenario
actions.lockAndQuery(product, query, image, 'live');
```

### Backend Integration
```python
# 1. LLM receives scenario parameter
await llm.stream_answer(context, query, scenario='live')

# 2. System prompt automatically includes guidance
# "SCENARIO: Live Performance Mode..."

# 3. LLM can use markers
# "[SUGGESTION: Product Name]"
# "[PRO TIP: advice text]"
```

---

## 📋 LLM Marker Reference

Use these in your LLM prompts:

```
[SUGGESTION: Product Name]
→ Renders as amber card with 💡 icon

[PRO TIP: Advice text goes here]
→ Renders as indigo card with ⚡ icon

[MANUAL: page 42]
→ Renders as gray reference with 📖 icon
```

---

## 🎨 Styling Reference

### Colors
- **Suggestions**: Amber (`bg-amber-500/10`, text `text-amber-100`)
- **Pro Tips**: Indigo (`bg-indigo-500/10`, text `text-indigo-100`)
- **Manual Refs**: Slate gray

### Icons
- Smart Pairing: 💡
- Pro Tips: ⚡
- Manual: 📖
- Scenarios: 📖 🎙️ 🎤

---

## 🧪 Testing Commands

### Test 1: Verify Parsing
```javascript
// In browser console, SmartMessage will auto-parse:
const testMsg = "Answer. [SUGGESTION: Widget] More. [PRO TIP: Tip]";
// Frontend renders 3 sections automatically
```

### Test 2: Verify Scenario Passing
```javascript
// In WebSocket network tab, check payload includes:
{
  "type": "query",
  "scenario": "live"  // Should see this
}
```

### Test 3: Verify LLM Integration
```bash
# Check that backend receives scenario in handle_query_event
# Add logging: print(f"Scenario: {scenario}")
```

---

## 📊 Data Flow Diagram

```
User Input
    ↓
ScenarioToggle (sets mode)
    ↓
ChatView (renders input box)
    ↓
lockAndQuery(product, query, scenario)
    ↓
WebSocket: { scenario: 'live' }
    ↓
handle_query_event(scenario)
    ↓
llm.stream_answer(..., scenario='live')
    ↓
LLM returns text with [SUGGESTION:], [PRO TIP:]
    ↓
SmartMessage.parseContentSections()
    ↓
Renders: Answer + Suggestions + Pro Tips
```

---

## 🔍 Troubleshooting Flowchart

```
Suggestions not showing?
├─ Check product has related_items in catalog
├─ Check LLM response has [SUGGESTION: ...]
├─ Check browser console for JS errors
└─ Check SmartMessage gets relatedItems prop

Wrong scenario advice?
├─ Check scenario field in WebSocket payload
├─ Check backend receives scenario parameter
├─ Check llm.py has scenario_guidance code
└─ Check LLM prompt includes scenario guidance

Parse errors?
├─ Check marker format: [SUGGESTION: text]
├─ Check closing bracket present
├─ Check no nested brackets
└─ Check regex in parseContentSections()
```

---

## 📝 Configuration Defaults

| Setting | Value | File | Line |
|---------|-------|------|------|
| Default Scenario | `'general'` | `useWebSocketStore.ts` | ~90 |
| Max Accessories | 5 | `main.py` | ~430 |
| Suggestion Color | `amber-500/10` | `SmartMessage.tsx` | ~165 |
| Pro Tip Color | `indigo-500/10` | `SmartMessage.tsx` | ~180 |
| Scenario Options | studio, live, general | `validation.py` | ~25 |

---

## 🚀 Deployment Steps

```bash
# 1. Backend
cd backend
pip install -r requirements.txt  # Ensure all deps
python -m pytest tests/          # Run tests
uvicorn app.main:app --reload

# 2. Frontend
cd frontend
pnpm install
pnpm run build
pnpm run dev

# 3. Verify
# Open browser dev console
# Check WebSocket messages include "scenario"
# Test each scenario button
```

---

## 💾 Key Files at a Glance

```
Core Implementation:
├─ backend/app/services/llm.py         [LLM scenario logic]
├─ backend/app/main.py                  [Query handler]
├─ backend/app/core/validation.py      [Scenario field]
├─ frontend/src/components/SmartMessage.tsx    [Parser]
├─ frontend/src/components/ScenarioToggle.tsx  [UI toggle]
└─ frontend/src/store/useWebSocketStore.ts     [State]

Documentation:
├─ docs/features/AI_EXTRAS_IMPLEMENTATION.md   [Technical]
├─ docs/features/AI_EXTRAS_EXAMPLES.md         [Examples]
├─ AI_EXTRAS_VERIFICATION.md                    [QA checklist]
└─ AI_EXTRAS_COMPLETE.md                        [Full guide]
```

---

## 💡 Pro Tips for Developers

### Customizing Scenarios
Edit in `llm.py`:
```python
if scenario == "your_scenario":
    scenario_guidance = """
    SCENARIO: Your Scenario Name
    - Your instruction 1
    - Your instruction 2
    """
```

### Customizing Colors
Edit in `SmartMessage.tsx`:
```typescript
// Change amber to your color
<div className="bg-your-color-500/10 text-your-color-100">
```

### Testing with Fake LLM
Replace `llm.stream_answer()` temporarily:
```python
async def stream_answer(self, context, query, scenario='general'):
    yield """Test answer [SUGGESTION: Test Product]
    [PRO TIP: Test tip]"""
```

---

## 📞 Support Matrix

| Issue | Solution | Doc |
|-------|----------|-----|
| How do I enable Smart Pairing? | Just add related_items to catalog, it's automatic | IMPLEMENTATION.md |
| How do I customize pro tip text? | Edit llm.py system prompt | IMPLEMENTATION.md |
| How do I change scenario options? | Edit validation.py QueryMessage | IMPLEMENTATION.md |
| Why isn't scenario persisting? | Check setScenarioMode() is called | EXAMPLES.md |
| How do I test offline? | Use fake LLM returning markers | VERIFICATION.md |

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] `ScenarioToggle` component compiles
- [ ] `SmartMessage` parses `[SUGGESTION: ...]` correctly
- [ ] WebSocket payload includes `scenario` field
- [ ] Backend `handle_query_event` receives scenario
- [ ] LLM prompt has scenario guidance
- [ ] System works with scenario='general' (default)
- [ ] Backward compatible (messages without scenario work)
- [ ] No console errors on startup

---

## 🎓 Learning Path

**New to the feature?**

1. Read: `AI_EXTRAS_COMPLETE.md` (5 min overview)
2. Skim: `AI_EXTRAS_EXAMPLES.md` (see real responses)
3. Check: Implementation in your IDE
4. Test: Run the verification checklist
5. Deploy: Follow deployment steps

**Want to customize?**

1. Read: `IMPLEMENTATION.md` (architecture)
2. Find: The file to edit (Quick Files table above)
3. Modify: Your change
4. Test: Single feature test
5. Verify: Nothing broke

**Troubleshooting an issue?**

1. Use: Troubleshooting Flowchart above
2. Check: Relevant documentation section
3. Review: Code comments in implementation
4. Debug: Browser DevTools + server logs

---

## 📈 Metrics to Watch

**Post-Deployment**, monitor:

```
- Scenario Toggle Clicks: (track which scenarios are popular)
- Suggestion CTR: (% users click on suggestions)
- Suggestion Revenue: (do suggestions drive sales?)
- LLM Latency: (is overhead noticeable?)
- Error Rate: (any parsing failures?)
```

---

## 🔐 Security Notes

✅ All accessories come from catalog (no free text)  
✅ Scenario is enum (no injection risk)  
✅ Input validation in place (QueryMessage)  
✅ No sensitive data in markers  
✅ LLM output sanitized before display  

---

## 📱 Browser Support

Tested on:
- ✅ Chrome/Edge 120+
- ✅ Firefox 121+
- ✅ Safari 17+
- ✅ Mobile (iOS 17+, Android 14+)

---

## 🎉 You're All Set!

The AI Extras system is ready to use. Start with the testing checklist and deploy when ready.

For questions, refer to the documentation files or review the implementation in your IDE.

**Happy shipping!** 🚀

---

*Last Updated: January 13, 2026*  
*Status: Production Ready*  
*Version: HSC JIT v3.3*
