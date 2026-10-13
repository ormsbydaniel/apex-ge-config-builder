# Add the supplied screenshot as the Tutorial 9 hero image

## What

Place the uploaded swipe-comparison screenshot (an estuary crossed by a long bridge — natural colour on the left, a false-colour water index on the right) as the hero image on the Multi-spectral data index page, following the same convention already used by Tutorials 2, 3, 4, 5, 6, 7 and 11.

## Steps

1. **Copy the image into both documentation locations** using the helper script, named `tutorial-09-hero`:

   ```text
   scripts/add-screenshot.sh /mnt/user-uploads/image-61.png tutorial-09-hero
   ```

   This writes `docs/assets/screenshots/tutorial-09-hero.png` (mkdocs source) and `public/guide/assets/screenshots/tutorial-09-hero.png` (in-app served guide) in one step, so the two copies cannot drift apart.

2. **Insert the image into the index page** at `docs/workshops/09-multi-spectral-data/index.md`, immediately after the `## Tutorial Objectives` heading and before the introductory sentence — the exact position every other tutorial index page uses:

   ```markdown
   ## Tutorial Objectives

   ![Swipe comparison over an estuary: natural colour on the left, a false-colour water index on the right](../../assets/screenshots/tutorial-09-hero.png)

   In this tutorial you will understand how the Geospatial Explorer handles multi-spectral data...
   ```

3. **Rebuild the guide strictly** and confirm it completes without warnings, then report the result.

4. **Note the change in `roadmap.md`** alongside the existing tutorial work.

## Technical details

- **Image as-is, no processing:** the upload is a 977 × 634 px PNG (aspect ratio 1.54). Existing tutorial heroes range from 1.57 to 2.48, so this fits the row without cropping or resizing.
- **Naming:** `tutorial-09-hero` is kebab-case and matches the `<area>-<subject>` pattern the helper script enforces, and mirrors the existing `tutorial-02-hero` … `tutorial-11-hero` files.
- **Path depth:** workshop index pages reference screenshots as `../../assets/screenshots/…` (two levels up from `docs/workshops/09-multi-spectral-data/`), not the `../` form used by exercise pages.
- **Alt text:** kept descriptive rather than naming the location — the scene looks like the Severn Estuary but that is an inference, so the caption says "an estuary" until you confirm the place. If you tell me the location and the two layers, I will make the caption specific.
- **Rebuild:** the mkdocs check needs a fresh virtualenv each session (`python3 -m venv /tmp/mkdocs-venv && /tmp/mkdocs-venv/bin/pip install -q mkdocs-material==9.5.44 pymdown-extensions==10.11.2`), then `/tmp/mkdocs-venv/bin/mkdocs build --strict`.
- **Nothing is published** — the live guide is only updated when you ask.
