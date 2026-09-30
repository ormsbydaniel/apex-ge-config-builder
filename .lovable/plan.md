# Vector styling controls — revamp proposals

## What's hard today (verified in code)

1. **Most properties are unreachable in the editor.** PropertyForm only renders properties that
already have a value, and new primitives are seeded with a handful of defaults
(defaults.ts). The catalogued "advanced" properties — dash pattern, line cap/join, miter
limit, label placement/offsets/align, icon anchor and tint, shape inner radius — can only be
set by switching to the JSON editor.
2. **The value mode is hidden behind a per-property chevron.** Each property row hides its
Constant / From field / By zoom / Expression selector behind a double-chevron "Advanced"
toggle. Collapsed non-constant values show only an italic summary line, so it's hard to see
which properties are data-driven at a glance.
3. **Nesting is 4–5 levels deep.** Dialog → collapsible rule card → primitive chips → panel
boxes → per-property boxes → stop tables. Each level adds a border and padding, so editing a
label offset means working through several disclosures.
4. **No feedback until Save + Preview.** You can't see what a rule looks like while building it.
5. **Many rules = one long scroll**, and a collapsed rule's summary is plain text.

## Proposals

### Proposal 1 — Fill the gaps, keep the shape (incremental)
Keep the rule-card layout; fix the worst friction only:
- Add an **"+ add property"** picker per panel so every catalogued property is reachable
  without JSON.
- Replace the per-property chevron with an **always-visible mode dropdown** per property;
  colour-code or badge data-driven values so they stand out.
- Flatten one nesting level (drop the panel boxes, use section headings).
Lowest risk, no new concepts, no data-model change.

### Proposal 2 — Two-pane rule manager (table + editor)
Mirror the Manage Fields redesign you approved:
- **Left:** compact rule table — name, filter summary, primitive swatches, visibility toggle,
  reorder — one row per rule.
- **Right:** the selected rule's editor, with **section tabs** (Marker / Line / Fill / Label /
  When) instead of stacked chip-driven boxes.
- Includes Proposal 1's fixes (property picker, always-visible mode selector).
Best structural fit for many rules; consistent with an established in-app pattern.

### Proposal 3 — Intent-first "recipes"
Start from what you want to achieve: pick a recipe (colour polygons by attribute, size points
by a value, label features, subset by rule), and the editor generates a scaffolded rule to
refine in a simplified editor. Falls back to the current editor/JSON for everything else.
Friendliest for newcomers, but the most build effort and risks maintaining two editors.

### Proposal 4 — Live preview styling studio
Split the dialog: editor on the left, **live map preview on the right** that applies changes
debounced as you type (the viewer iframe handshake already exists). Save still commits to the
config. Can be layered on top of Proposal 1 or 2 — it changes feedback, not structure.
Highest impact on confidence, highest complexity.

## Recommendation

**Proposal 2 as the structural core, with Proposal 1's fixes folded in.** It solves pain
points 1, 2, 3 and 5 at once and reuses the table pattern already proven in Manage Fields.
Proposal 4 is a strong follow-on once the structure settles.

## Next step

Tell me which proposal to take (or a mix, e.g. 2 + 4). I'll then draft the detailed
implementation plan — and if you'd like to see it before committing, I can generate rendered
design previews of the chosen direction against a screenshot of the current dialog.
