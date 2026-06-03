## Goal
Enable the documentation link that's currently commented out in the top toolbar.

## Change
In `src/components/ConfigBuilder.tsx` (lines 268–286), remove the comment wrapper around the User Guide `<TooltipProvider>` block so the BookOpen icon button is rendered again. It links to `/guide/index.html` (the bundled MkDocs site already in `public/guide/`) and opens in a new tab.

No other changes — the docs assets, tooltip, and styling are already in place.
