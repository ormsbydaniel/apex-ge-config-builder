# Review tutorial step size before rewriting

## Aim
Find a consistent balance between too many tiny numbered steps and steps that ask the reader to do too much at once. This is an editorial review first: **do not change tutorial pages or rebuild the guide yet**.

## Proposed rule to test
- Make a numbered step one meaningful task or checkpoint, not necessarily one click. Combine adjacent instructions that belong to the same short task in the same screen or dialog.
- Use a short, four-space-indented bullet list under that step when several fields, values, choices, or ordered sub-actions need to stay easy to scan. Keep a concise pair of actions in one sentence instead of forcing bullets.
- Keep a separate numbered step when the reader changes task, needs to inspect or compare a result, crosses a meaningful screen boundary, or could reasonably pause before continuing. Do not merge steps merely to lower the count.
- Split a long step into nested bullets when it contains several actions or values that are hard to find on rereading; retain their sequence. Preserve screenshots, links, warnings, optional paths, and the lesson's meaning.

## Review and deliverable
1. Review all tutorial instructional pages, including pages that use task headings rather than numbered lists. Mark concrete candidates as **combine**, **add sub-bullets**, or **leave separate**, with a brief reason and suggested wording for the strongest examples.
2. Use 2-8 as the calibration example: combine choosing the colormap and entering its min/max in step 2; make adding/saving the colormap and returning to the layer card step 3. Keep Preview and checking values as distinct observation tasks.
3. Include contrasting examples in the review: 2-7's metadata inspection and min/max note may form one step; 3-5's lengthy catalogue-search step may benefit from nested bullets; 8-4's source fields may be grouped, but its Preview result should remain a separate checkpoint. Assess other candidates on their merits rather than applying a mechanical merge.
4. Present a concise chapter-by-chapter change shortlist, examples of the rule in action, and any borderline cases for your feedback. **No tutorial text will be edited in this pass.**

## Technical note
If revisions are agreed in a later pass, keep MkDocs nested list content indented four spaces under numbered items and verify the rendered guide. The author-facing rule can then be added to the guide's writing guidance if you want it retained for future tutorials.
