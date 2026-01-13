# HSC JIT v3: AI Extras Feature Implementation

## Overview

We've successfully implemented three advanced features that expand the system's capabilities while maintaining the **Evidence First Protocol** and **Official Source Trust**:

1. **Smart Pairing Module** - Intelligent accessory recommendations
2. **Pro Tip Badge** - Scenario-aware field notes and warnings
3. **Scenario Mode** - Context-switching for Studio vs. Live performance

---

## Feature 1: Smart Pairing Module (Accessories)

### What It Does
When a user asks about a feature, the AI recommends one official accessory from the product's `related_items` catalog that enhances that specific feature.

### How It Works

**Backend (in `handle_query_event`):**
- Retrieves `related_items` from the product context
- Injects them into the LLM prompt as "Official Accessories"
- The LLM can now suggest items with `[SUGGESTION: <product_name>]` markers

**Frontend (in `SmartMessage.tsx`):**
- Parses the response for `[SUGGESTION: ...]` sections
- Renders them in a dedicated **amber-colored card** with 💡 icon
- Each suggestion is visually distinct from the main answer

### Example Flow
```
User: "Does the Nord Stage 4 have a sustain pedal?"
↓
LLM receives:
  - Manual excerpt (yes, it supports sustain)
  - Official Accessories: Nord Triple Pedal 2, Nord Sustain Pedal, ...

LLM Response:
  "Yes, the Nord Stage 4 has a dedicated sustain pedal input. 
  [SUGGESTION: The Nord Triple Pedal 2 unlocks half-pedaling and pedal noise features]"

Frontend Renders:
  ✅ **Answer** (plain text): "Yes, it has sustain..."
  💡 **Smart Pairing** (amber card): "The Nord Triple Pedal 2 unlocks..."
```

### Key Benefits
- **Separates Facts from Upsells** - Clear visual distinction
- **Relevant Suggestions** - Based on the user's actual question
- **Official Only** - Uses catalog data, no hallucinations

---

## Feature 2: Pro Tip Badge (Field Advice)

### What It Does
The LLM can provide real-world usage advice, warnings, and workarounds outside the manual, clearly marked as field notes.

### How It Works

**Backend (in `llm.py`):**
The system prompt now instructs:
> "After answering the question, add a section labeled [PRO TIP:] where you suggest a real-world use case, setting, or warning based on the specs."

**Frontend (in `SmartMessage.tsx`):**
- Parses `[PRO TIP: ...]` sections
- Renders them in an **indigo-colored card** with ⚡ icon
- Clearly separates verified facts from advice

### Example Flow
```
User: "How do I save a preset on the TR-8S?"
↓
LLM receives scenario context: "studio" vs "live"

Studio Mode Response:
  "Press Write. Name it with the encoder.
  [PRO TIP: Use descriptive names (e.g., 'Deep House Kick') for quick recall during sessions]"

Live Mode Response:
  "Press Write.
  ⚠️ **WARNING:** This stops audio for 2 seconds. Never do this during a performance!"
```

### Scenario-Aware Warnings
The system can adjust warnings based on context:
- **Studio Mode**: Emphasizes workflow and setup
- **Live Mode**: Highlights stage-readiness and reliability concerns
- **General Mode**: Balanced technical information

---

## Feature 3: Scenario Mode (Active Context)

### What It Does
Users can toggle between "Studio", "Live Stage", and "General" modes to get context-specific advice.

### How It Works

**Frontend (in `ScenarioToggle.tsx`):**
- New UI toggle in ChatView with three buttons:
  - 📖 **General** - Standard technical support
  - 🎙️ **Studio** - Recording & production focused
  - 🎤 **Live Stage** - Live performance warnings

**Backend Flow:**
1. User selects a scenario mode (stored in `useWebSocketStore.scenarioMode`)
2. When sending a query, the `scenario` field is attached:
   ```json
   { "type": "query", "product_id": "...", "query": "...", "scenario": "live" }
   ```
3. The LLM receives scenario guidance in the prompt:
   ```
   SCENARIO: Live Performance Mode
   - Highlight reliability and stage-readiness
   - Mention when operations cause audio interruption
   - Suggest quick workarounds for live scenarios
   ```

**Frontend (in `SmartMessage.tsx`):**
- Renders sections with visual cues
- Suggestions appear in amber cards
- Pro tips appear in indigo cards

### Integration Points

**Zustand Store (`useWebSocketStore.ts`):**
```typescript
scenarioMode: ScenarioMode; // 'general' | 'studio' | 'live'
actions.setScenarioMode(mode); // Update current scenario
```

**Query Sending:**
```typescript
lockAndQuery(product, query, imageData, 'live'); // Pass scenario explicitly
// OR
actions.setScenarioMode('studio'); // Set globally for session
```

---

## Implementation Details

### Files Modified

1. **Backend:**
   - `backend/app/services/llm.py` - Updated `stream_answer()` with scenario parameter and enriched prompt
   - `backend/app/core/validation.py` - Added `scenario` field to `QueryMessage`
   - `backend/app/main.py` - Updated `handle_query_event()` to extract and pass scenario

2. **Frontend:**
   - `frontend/src/store/useWebSocketStore.ts` - Added scenario state and setters
   - `frontend/src/components/ChatView.tsx` - Added `ScenarioToggle` import and render
   - `frontend/src/components/SmartMessage.tsx` - Rewrote to parse and render sections
   - `frontend/src/components/ScenarioToggle.tsx` - New component for mode selection

### Message Flow

```
User Input
  ↓
[ScenarioToggle] User selects "Live Stage"
  ↓
[App.tsx] Stores scenarioMode = 'live'
  ↓
[ChatView] User asks question
  ↓
[useWebSocketStore] lockAndQuery(product, query, imageData, 'live')
  ↓
[WebSocket] Sends:
  {
    "type": "query",
    "product_id": "nord-stage-4",
    "query": "How do I save presets?",
    "scenario": "live"
  }
  ↓
[main.py] handle_query_event() extracts scenario='live'
  ↓
[llm.py] stream_answer(..., scenario='live')
  ↓
LLM Prompt includes:
  "SCENARIO: Live Performance Mode
   - Highlight reliability and stage-readiness
   - Mention when operations cause audio interruption"
  ↓
LLM Response:
  "Press Write. **WARNING:** This stops the sound for 2 seconds.
   Do not do this while the band is playing!
   [PRO TIP: Save all presets before going on stage]"
  ↓
[SmartMessage] Parses response:
  - Main answer (plain section)
  - [PRO TIP:] section → indigo card with ⚡
  ↓
User sees formatted response with visual hierarchy
```

---

## API Changes

### WebSocket Message Format

**Before:**
```json
{
  "type": "query",
  "product_id": "nord-stage-4",
  "query": "How do I save presets?",
  "image": "data:image/png;base64,..."
}
```

**After:**
```json
{
  "type": "query",
  "product_id": "nord-stage-4",
  "query": "How do I save presets?",
  "scenario": "live",
  "image": "data:image/png;base64,..."
}
```

### LLM Prompt Structure

The system prompt now includes:
1. **CRITICAL INSTRUCTIONS** - Core behavior
2. **SCENARIO GUIDANCE** - Context-specific modifiers (if scenario !== 'general')
3. **Context Section** - Manual + brand + accessories
4. **User Question**

### Response Format (Implicit Parsing)

The LLM can now mark sections:
- `[SUGGESTION: Product Name]` - Smart pairing recommendation
- `[PRO TIP: advice text]` - Field note or warning
- `[MANUAL: page X]` - Reference to manual excerpt

The frontend parses these markers and renders with appropriate styling.

---

## Testing Guide

### Test 1: Smart Pairing
```
1. Open ZenFinder, select "Roland TR-8S"
2. Ask: "Does this have audio outputs?"
3. Expected: Suggestion for mixer or interface in amber card
```

### Test 2: Pro Tip (Studio Mode)
```
1. Select Scenario: 🎙️ Studio
2. Ask: "How do I apply effects?"
3. Expected: Pro tip about workflow optimization
```

### Test 3: Pro Tip (Live Mode)
```
1. Select Scenario: 🎤 Live Stage
2. Ask: "How do I save a preset?"
3. Expected: ⚠️ WARNING about audio interruption
```

### Test 4: Scenario Persistence
```
1. Select 🎤 Live Stage
2. Ask multiple questions
3. Expected: All responses have live-mode warnings (if applicable)
4. Switch to 🎙️ Studio
5. Expected: Same question now shows studio-focused advice
```

---

## Future Enhancements

1. **Scenario Presets** - Save favorite scenario combinations per user
2. **Confidence Scoring** - Show accuracy/relevance of suggestions
3. **Feedback Loop** - Let users rate suggestions, improve recommendations
4. **Custom Scenarios** - Users define their own context (e.g., "Wedding DJ", "Recording Artist")
5. **Multi-Step Scenarios** - "I want to record a live session" → auto-select needed accessories
6. **Analytics** - Track which scenarios/suggestions drive engagement

---

## Troubleshooting

### Suggestions Not Appearing
- Check: Does the product have `related_items` in catalog?
- Check: Does the LLM response include `[SUGGESTION: ...]`?
- Check: Browser console for parsing errors

### Pro Tips Not Showing
- Check: Is the scenario context being sent to the backend?
- Check: Is the LLM instructed to include `[PRO TIP: ...]`?
- Debug: Log the raw LLM response in browser console

### Scenario Not Persisting
- Check: Is `useWebSocketStore.scenarioMode` being updated?
- Check: Is the scenario passed to `lockAndQuery()`?
- Check: Are subsequent queries including the scenario field?

---

## Configuration

### Default Scenario
Change in `useWebSocketStore.ts`:
```typescript
scenarioMode: 'general', // Default scenario mode
```

### LLM Scenario Guidance
Customize in `llm.py` `stream_answer()`:
```python
scenario_guidance = """
SCENARIO: Custom Scenario Name
- Custom instruction 1
- Custom instruction 2
"""
```

### UI Colors
Adjust in `ScenarioToggle.tsx` and `SmartMessage.tsx`:
- Suggestion (Smart Pairing): `bg-amber-500/10` → customize color
- Pro Tip: `bg-indigo-500/10` → customize color

---

## Performance Impact

- **Backend**: Minimal - just adds scenario string to prompt
- **Frontend**: Negligible - parsing regex is cached with `useMemo`
- **LLM Latency**: May vary based on additional context length
- **Network**: No change - payload size increases by ~10-20 bytes

---

## Compliance & Safety

✅ **Evidence First Protocol** - Manual always speaks first  
✅ **Official Source Only** - Accessories from catalog  
✅ **Clear Separation** - Suggestions visually distinct from facts  
✅ **No Hallucinations** - All context is grounded in data  
✅ **User Control** - Scenario is user-selectable, not forced  

---

**Status**: ✅ Implementation Complete  
**Last Updated**: January 13, 2026  
**Version**: HSC JIT v3.2 (AI Extras)
