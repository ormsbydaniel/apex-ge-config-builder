# Tutorial step reviewer (AI-assisted)

## Outcome
A new **Tutorial Review** tool in the Configuration Builder where an editor pastes a Markdown tutorial section and gets back:
- a list of flagged step breaks (too fragmented, or overloaded), each with the reason and the affected step numbers;
- a suggested rewrite of the section that applies the agreed step-balance rule, rendered side by side with the original, with a **Copy Markdown** button.

Nothing is written to the docs automatically — the editor copies what they want into the Markdown file.

## Where it lives
- A new **Tutorial Review** tab, hidden by default and switched on from the existing builder preferences (same pattern as the Algorithms and Storymaps tabs), so normal config users never see it.
- Layout: Markdown input on the left, results on the right (issues list above, suggested Markdown below with a rendered preview toggle). Stop button while the review runs; clear error messages for rate limits or credit exhaustion.

## How the review works
- The model is given the house rule: one numbered step = one meaningful task or checkpoint; combine short actions on the same screen; use four-space-indented bullets for several fields/values; keep separate steps for inspecting results, new decisions, screen changes, or natural pauses; never merge Preview/verification checkpoints; preserve screenshots, links, callouts, optional sections, URLs and copied values exactly.
- It must also output MkDocs-safe Markdown (four-space indentation for anything under a numbered step).
- The answer streams in, so long sections show progress.

## Technical details
- Enable Lovable Cloud and add one server function (`tutorial-review`) that calls the AI Gateway Responses endpoint with model `openai/gpt-6-astra`, streaming, reasoning on (medium), `store: false`, key held server-side. The function returns structured output: `issues[] { steps, kind: fragmented|overloaded|other, reason }` and `suggestedMarkdown`; limits stated in the prompt, parsed defensively with a fallback.
- Input size stated to the editor (e.g. one tutorial page at a time); oversized input rejected with a message rather than silently truncated.
- Frontend: new `TutorialReviewTab` component, `showTutorialReviewTab` flag added to `useAppSettings`, tab registered alongside existing tabs. No config schema changes (this is not part of the exported JSON).
- The step-balance rule text also added to the Authors Guide so humans and the tool share one definition.
- Verify one real request end to end after building; the user does the visual testing.
