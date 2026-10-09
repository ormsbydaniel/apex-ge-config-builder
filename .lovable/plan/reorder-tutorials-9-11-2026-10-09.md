# Reorder Tutorials 9–11

New order:

```text
8.  Statistics                    (unchanged)
9.  Multi-spectral data           (was 11)
10. Vector data                   (unchanged)
11. Coordinate reference systems  (was 9)
```

## Changes

1. **Rename folders** in `docs/workshops/`:
   - `09-coordinate-reference-systems` -> `11-coordinate-reference-systems`
   - `11-multi-spectral-data` -> `09-multi-spectral-data`
   - `10-vector-data` stays.
2. **Renumber page labels** inside each moved tutorial (front-matter `title`, `#` heading, overview step lists, and in-text cross references such as "see 9-3" / "9-2" -> 11-3 / 11-2; "11-1" -> 9-1 etc.).
3. **Pre-requisites wording**: "Tutorial 11 pre-requisites data" -> "Tutorial 9 pre-requisites data" for multi-spectral. CRS pre-requisites will be checked and updated if it names a tutorial number.
4. **Hero image**: rename `tutorial-09-hero.png` -> `tutorial-11-hero.png` in both screenshot locations (docs and served guide copy) and update the reference, so image names keep matching tutorial numbers.
5. **mkdocs.yml**: reorder the nav block to 9 Multi-spectral, 10 Vector, 11 CRS with new paths and labels.
6. **nav-groups.js**: update the folder list order and the folder -> label map.
7. **Sweep all docs** (including Tutorials 1–8, reference and guide pages) for links to the old folder paths or "Tutorial 9/11" mentions and repoint them.
8. **Rebuild the guide** so the served copy matches, remove stale built folders for the old paths, and confirm the build has no warnings.

## Notes
- The GitHub tutorial configs named "Tutorial 9/11 pre-requisites data" (if any exist) are outside this project; you'll need to rename them there to match.
- Old guide web addresses (`.../09-coordinate-reference-systems/`) will stop working; no redirects added unless you want them.
