# Focused icon screenshots for the tutorials

## Goal
Where a step says "click the pencil / duplicate / (i) / trash can", show a small cropped picture of that row of icons with a red arrow (or ring) pointing at the one to click. Readers find the button at a glance instead of hunting.

## Style (same for every shot)
- Crop tightly to the row or section containing the icon (about 500-800 px wide), never the whole screen.
- One red arrow or ring per shot, pointing at the target icon; neighbouring icons left visible for context.
- Placed directly under the step that mentions it, inside the numbered list.
- File names follow the existing kebab-case convention, e.g. `icon-layer-duplicate.png`, saved to both screenshot folders.
- A reusable shot is made once and used on every page that needs it.

## Shared "icon library" (made once, reused)
1. Layer card top row: duplicate layer
2. Layer card top row: edit (pencil)
3. Layer card top row: delete / move arrows
4. Dataset row: (i) info icon
5. Dataset row: edit pencil
6. Dataset row: copy / delete
7. Data visualisation: pencil next to Colormaps
8. Data visualisation: red trash can next to multi-band visualisation
9. Data visualisation: pencil to choose a multi-band visualisation
10. Home tab: pen icon next to Application Title
11. Interface group: pen icon (rename)
12. Top bar: Export button and Preview button
13. Preview: layer Filter (funnel) icon
14. Load dialog: Tutorials tab

## Per-tutorial plan
| Tutorial | Steps to illustrate | Shots |
|---|---|---|
| 1 Familiarisation | 1-3 "Click Preview" | 12 |
| 2 Getting started | 2-3 Application Title pen, group pen; 2-4 Export; 2-7 (i) on new COG row; 2-8 Colormaps pencil; 2-9 "Add layer" button; 2-10 (i) on WMS row (existing shot gets an arrow) | 10, 11, 12, 4, 7, new "Add layer" |
| 3 Working with services | Add source from service list; dataset row edit | 5, existing service list shot + arrow |
| 4 Fine-tuning | 4-3 "Edit Controls" button and Custom extent option | new "Edit Controls" |
| 5 Categorical data | Categories pencil in Data visualisation | new categories pencil |
| 6 Time series | Timestamp management / add timestamps button | new timestamps button |
| 7 Constraints | 7-3 Colormaps pencil; 7-3 funnel in Preview; 7-4 "Add constraint source" | 7, 13, new constraints button |
| 8 Statistics | 8-4 "Add statistics source"; 8-7 "+Add all" | new statistics button, new Add all |
| 9 Multi-spectral | 9-1 Load → Tutorials; 9-3 multi-band pencil; 9-4/9-5/9-6 duplicate, pencil, red trash can, (i) on band | 14, 1, 2, 8, 9, 4 |
| 10 Vector data | Pre-requisites Load; styling pencil (when 10-3 is written) | 14, later |
| 11 CRS | Load step; Settings CRS add/edit | 14, new CRS settings shot |

Priority order: Tutorial 9 (most icon-heavy, freshest), then 2, then 7-8, then the rest.

## How the shots are produced
- I capture each screenshot from the running app with the relevant tutorial config loaded, crop to the row, and draw the arrow automatically — so every shot looks identical and can be regenerated if the icons change.
- You can still swap in your own screenshots at any time; the arrow step works on any image.
- Each batch is added to its pages, the guide rebuilt in strict mode, and left unpublished for your review.

## Technical details
- Capture script under `scripts/` (Playwright: load config via URL, locate element by aria-label, element screenshot with padding), annotate with Pillow (red arrow + optional ring), output through `scripts/add-screenshot.sh` for dual-location copy.
- Missing aria-labels on icon buttons will be added where needed so the script can find them reliably (presentation-only change).
- Image markup: `![Layer card top row with the duplicate icon highlighted](../../assets/screenshots/icon-layer-duplicate.png){ width="420" }`, indented under the list item.

## Question for you
Tutorials 10 and 11 pre-requisite configs don't exist yet; their shots will wait until those are added.
