# Correct nested lists throughout the tutorials

- Use tutorial 9-3 as the working reference. Correct the nested bullets in 9-4 and 3-5 so they render beneath their numbered steps, not as additional numbered steps.
- In 9-4, also keep the continuation under step 2 attached to that step and fix the two callouts whose bodies currently render as ordinary text.
- Review every tutorial page for matching list and continuation patterns, correcting any other cases where the rendered guide differs from the intended numbering or nesting. Preserve lesson wording and ordering except where a minimal formatting change is needed.
- Rebuild the guide and check the generated pages: nested bullets belong to the intended steps, numbering stays continuous within each section, and callouts render as callouts. Do not publish.

## Technical details

MkDocs uses Python-Markdown. Four-space indentation under numbered items is required for nested bullets and continuation text; use a blank line where needed to create a nested list. Compare Markdown sources with the generated HTML, rather than relying on indentation alone. The current generated guide shows 9-4's three field bullets as steps 3–5 and 3-5's three styling bullets as steps 7–9; 9-3's nested lists render correctly. Register no new tutorial pages or navigation entries.
