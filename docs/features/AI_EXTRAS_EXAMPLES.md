# AI Extras: Example Responses

This document shows realistic example responses from the system demonstrating the three AI Extras features in action.

---

## Example 1: Smart Pairing - Studio Setup

**Context**: User asks about the Roland TR-8S in Studio mode

### User Query
```
"Does the TR-8S have individual audio outputs? I want to mix kick and snare separately."
```

### Scenario & Context Sent to LLM
```
Scenario: studio
Official Accessories: Roland TR-8S Sync Cable, Roland TR-8S Stand, Behringer X-Touch Mini
Manual context: (excerpts about individual outputs)
```

### LLM Response (as streamed)
```
This product is from Roland (🇯🇵 Japan) and is manufactured in Indonesia 🇮🇩.

Yes, the TR-8S features **six individual assignable audio outputs** 
in addition to the stereo mix output. This gives you complete control 
over each drum track during mixing.

Each of the six outputs can be assigned to:
- Individual drum sounds (kick, snare, hi-hats, tom, percussion, cymbal)
- Or custom grouped combinations
- Via the ASSIGN knob and encoder controls

This is perfect for studio recording where you want individual 
tracks for post-processing. [MANUAL: See page 24 for output assignment details]

[SUGGESTION: The Roland TR-8S Stand keeps your unit secure during 
studio sessions and frees up desk space for additional gear]

[PRO TIP: Create separate output chains for kick and snare when recording. 
Use output 1-2 for kick, 3-4 for snare with compression and EQ plugins. 
This workflow gives you professional-grade mixing flexibility and 
helps with glue compression later in the master chain.]
```

### How Frontend Renders This

```
✅ Answer (plain text section):
"Yes, the TR-8S features six individual assignable audio outputs..."

💡 Smart Pairing (amber card):
"The Roland TR-8S Stand keeps your unit secure during studio sessions 
and frees up desk space for additional gear"

⚡ Pro Tip (indigo card):
"Create separate output chains for kick and snare when recording. 
Use output 1-2 for kick, 3-4 for snare with compression and EQ plugins. 
This workflow gives you professional-grade mixing flexibility..."
```

---

## Example 2: Pro Tip Warning - Live Performance

**Context**: Same question but user switched to Live Stage mode

### User Query (Same)
```
"How do I save a preset on the TR-8S?"
```

### Scenario & Context Sent to LLM
```
Scenario: live
Official Accessories: [same list]
Manual context: [same manual excerpt]
SCENARIO GUIDANCE:
  - Highlight reliability and stage-readiness
  - Mention when operations cause audio interruption
  - Suggest quick workarounds for live scenarios
```

### LLM Response (Live Mode)
```
This product is from Roland (🇯🇵 Japan) and is manufactured in Indonesia 🇮🇩.

To save a preset on the TR-8S:

1. Press the WRITE button
2. Use the encoder to name your patch
3. Press WRITE again to confirm

⚠️ **CRITICAL FOR LIVE PERFORMANCE:**
The TR-8S **pauses audio output for ~2 seconds during preset save**. 
This is a hardware limitation - do NOT attempt to save mid-performance 
as the audience will experience dead air.

[PRO TIP: Pre-program all presets before taking the stage. 
Use the scene select buttons (1-16) to switch between pre-saved patterns 
during your set. If you must save during a gig, only do it between songs 
during a breakdown where the stop is less noticeable.]
```

### How Frontend Renders This

```
✅ Answer (plain section):
"To save a preset... Press WRITE button..."

⚠️ Pro Tip (indigo card with WARNING):
"The TR-8S pauses audio output for ~2 seconds during preset save. 
This is a hardware limitation - do NOT attempt to save mid-performance..."

💡 Pro Tip (second indigo card):
"Pre-program all presets before taking the stage. 
Use the scene select buttons (1-16) to switch between pre-saved patterns..."
```

---

## Example 3: Smart Pairing + Pro Tip Combo

**Context**: User asks about pedals on Nord Stage 4

### User Query
```
"Does the Nord Stage 4 support multiple pedals? What pedals work with it?"
```

### Scenario & Context
```
Scenario: general
Official Accessories: Nord Triple Pedal 2, Nord Sustain Pedal, Nord Expression Pedal
Manual context: (sections on pedal inputs and compatibility)
```

### LLM Response
```
This product is from Nord (🇸🇪 Sweden) and is manufactured in Sweden 🇸🇪.

The Nord Stage 4 supports **multiple foot pedal inputs**:

- **Sustain Input** (3.5mm) - Any standard sustain pedal
- **Expression Pedal Input** (6.3mm stereo jack) - Continuous control
- **Switch Input** (6.3mm) - Footswitch for effects/arp control

You can use multiple pedals simultaneously:
- Sustain pedal on the sustain input
- Expression pedal on the expression input  
- Optional footswitch for program selection

The Nord Stage 4 comes without pedals - you need to purchase them separately.

[SUGGESTION: The Nord Triple Pedal 2 is the official accessory that 
combines sustain, expression, and switch in a single professional unit. 
Unlike separate pedals, it supports half-pedaling which unlocks unique 
sonic possibilities - especially for string libraries]

[SUGGESTION: If you want a more compact rig, the Nord Expression Pedal 
gives you full modulation control in a single pedal, and Nord's Sustain 
Pedal handles the black-and-white keys functionality]

[PRO TIP: Make sure to route the expression pedal to appropriate parameters 
(volume, filter cutoff, effects send) in the Nord Setup menu. The default 
routing is just to volume, but the Stage 4 is incredibly deep - you can 
modulate virtually any parameter with expression in real-time.]
```

### How Frontend Renders This

```
✅ Answer (plain section):
"The Nord Stage 4 supports multiple foot pedal inputs..."

💡 Smart Pairing (amber card - first suggestion):
"The Nord Triple Pedal 2 is the official accessory that combines sustain, 
expression, and switch in a single professional unit..."

💡 Smart Pairing (amber card - second suggestion):
"If you want a more compact rig, the Nord Expression Pedal gives you 
full modulation control..."

⚡ Pro Tip (indigo card):
"Make sure to route the expression pedal to appropriate parameters 
(volume, filter cutoff, effects send) in the Nord Setup menu..."
```

---

## Example 4: Fallback Graceful Handling

**Scenario**: User asks question that doesn't warrant suggestions/tips

### User Query
```
"What's the power consumption of the Moog Moogerfooger?"
```

### LLM Response (No markers)
```
This product is from Moog Music (🇺🇸 United States) and is manufactured in United States 🇺🇸.

The Moogerfooger (filter module in the Moogerfooger series) requires:

- **Input Power**: Two 9V batteries OR external PSU
- **Current Draw**: Approximately 50mA per unit
- **Power Supply**: 2×9V alkaline batteries typically last 30-40 hours of continuous use
- **External Option**: Moog PSU-2 or any standard 9V/100mA power supply

For portable use, batteries are fine. For rack/live rig use, an external 
power supply is recommended to avoid mid-set battery failures.
```

### How Frontend Renders This

```
✅ Answer (plain section):
"The Moogerfooger requires... Two 9V batteries OR external PSU..."

(No colored cards appear - section parsing returns empty sections)
```

---

## Example 5: Manual Reference Markers

**Scenario**: User asks detailed technical question

### LLM Response
```
This product is from Elektron (🇸🇪 Sweden) and is manufactured in Sweden 🇸🇪.

The Analog Rytm MK II's motion recording captures parameter changes 
in realtime as you perform. Here's how:

1. Press MOTION REC
2. Turn encoders/knobs to capture automation
3. Press MOTION REC again to stop recording

[MANUAL: Complete motion recording workflow is on page 34-35]

The recorded motion will loop with your pattern - you can have up to 
16 different motion tracks per pattern.

[MANUAL: For advanced motion editing, see "Motion Editing" on page 47]

[PRO TIP: Motion recordings are pattern-specific, so create variations 
with different motion sequences rather than trying to store multiple 
performances in a single project.]
```

### How Frontend Renders

```
✅ Answer (plain sections):
"The Analog Rytm MK II's motion recording captures parameter changes..."

📖 Manual Reference (subtle gray section):
"Complete motion recording workflow is on page 34-35"

📖 Manual Reference (subtle gray section):
"For advanced motion editing, see 'Motion Editing' on page 47"

⚡ Pro Tip (indigo card):
"Motion recordings are pattern-specific, so create variations 
with different motion sequences..."
```

---

## Example 6: Scenario Impact - Same Question, Different Modes

### Question
```
"How do I quickly switch sounds during a performance?"
```

#### General Mode Response
```
The TR-8S has 16 Scene buttons that store complete 
kit configurations (drum sounds, effects, levels, output assignments).

Press the numbered Scene buttons (1-16) to instantly recall 
your pre-programmed sounds. Each Scene is independent.
```

#### Studio Mode Response
```
The TR-8S has 16 Scenes for organizing different kit setups.

For recording, you can switch between completely different drum kits 
using the Scene buttons. Create scenes for:
- Deep House Kit (with low-pitched drums)
- Melodic Kit (with pitched percussion)
- Experimental Kit (with granular sounds)

This helps organize your production sessions.

[PRO TIP: Save a master scene with default routing and levels, 
then create variations from that. This ensures consistency when 
switching between different kits during multitrack recording.]
```

#### Live Mode Response
```
The TR-8S has 16 Scene buttons for instant sound switching on stage.

Press Scene buttons 1-16 to recall complete kit configurations instantly. 
This is perfect for live - each scene stores everything (sounds, effects, levels).

⚠️ **CRITICAL:** Switching scenes takes ~150ms. This is barely noticeable 
to the audience, but experienced drummers notice. Avoid switching during 
fills or complex parts - do it during beats or transitions.

[PRO TIP: Map scenes to your song structure: 
Scenes 1-4 for Intro, 5-8 for Verse, 9-12 for Chorus, 13-16 for Outro. 
This lets you step through your DJ/producer set with minimal mental load during performance.]
```

---

## Key Observations

1. **Smart Pairing** appears when there's a relevant accessory
2. **Pro Tips** always appear but change based on scenario
3. **Manual References** are minimal and serve as citations
4. **Multiple Suggestions** can appear in a single response
5. **Graceful Fallback** - if no markers, response is plain text
6. **Scenario Impact** - same question gets different advice based on context

---

## Implementation Notes for Testing

### In Your Browser Console

To test parsing, you can run:

```javascript
// Test SmartMessage parsing
const testContent = `
Answer text here.
[SUGGESTION: Product Name]
More answer.
[PRO TIP: Field note here]
`;

// SmartMessage component will automatically parse this
```

### To Force Test Responses

You can edit `llm.py` to return test strings:

```python
# In stream_answer(), after building prompt:
yield """
This product is from Test Brand (🇨🇦 Canada) and is manufactured in Test Country 🇨🇦.

Test answer text.

[SUGGESTION: Test Accessory Product]

[PRO TIP: Test pro tip advice]
"""
```

---

**Version**: 1.0  
**Last Updated**: January 13, 2026
