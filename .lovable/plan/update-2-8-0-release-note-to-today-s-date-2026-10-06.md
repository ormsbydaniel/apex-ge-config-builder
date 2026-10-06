# Update 2.8.0 release note to today's date

## Change
- In `src/constants/announcements.ts`, change the date of the 2.8.0 announcement (top entry) from `2026-10-05` to `2026-10-06`. Title and category unchanged.

## Verification
- No tests cover announcement dates; confirm via file read that the top entry now shows the new date. The Latest updates panel renders the date from this constant, so it will display 6 Oct 2026.
