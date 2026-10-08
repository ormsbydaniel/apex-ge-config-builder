# Fix the truncated Import Layer Card list

## Goal
Make the Examples and Tutorials card lists use the full available height of the Import Layer Card dialog, while keeping the tabs and Cancel action fixed in place.

## Implementation
- Replace the competing nested flex-height rules in the dialog’s idle view with an explicit three-row layout:
  1. tab navigation,
  2. a `minmax(0, 1fr)` content area,
  3. the fixed footer.
- Give the tab container its own navigation/content row structure and make each active tab panel fill the content row.
- Keep vertical scrolling on the card-list panel itself, so long Examples, Test & development, and Tutorials lists remain fully reachable without scrolling the dialog header or footer.
- Apply the same sizing contract to Upload and From GitHub so switching tabs cannot change or collapse the available content height.

## Verification
- Extend the focused dialog test to assert the shared full-height/scroll-region structure for the source panels.
- Run the existing Import Layer Card tests and TypeScript checks.
- Leave detailed visual verification to the user, following the project preference.

## Scope
No changes to source loading, donor validation, card selection, or import behaviour.
