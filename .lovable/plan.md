## Goal

Reframe the workshop content as reusable **Tutorials**, split into a required **Core** track and optional **Topic** tracks. Workshops become a small section *inside* the Tutorials tab — curated agendas of the form "do the core, then pick a topic". The first and only agenda for now is **FOSS4G UK 2026**.

## Numbering: drop it from tutorial paths, keep it on steps

Hierarchical numbers (`4-1`, `4-2`) break down as soon as a topic gains, loses, or reorders a tutorial — every change churns directory names, URLs, and cross-links. Instead:

- **Tutorial folders**: no number prefix — `tutorials/core/first-config/`, `tutorials/time-series/cog-timestamps/`
- **Steps inside a tutorial**: keep `01-`, `02-` prefixes — genuinely sequential and stable
- **Order and grouping**: expressed by the `mkdocs.yml` nav and the Core/Topics split, which can change freely without touching files

## Structure

```text
docs/tutorials/
  index.md                          What tutorials are; Core vs Topics; how to pick
  core/
    familiarisation/                (was 01-familiarisation)
    first-config/                   (was 02-getting-started)
    working-with-services/          (was 03-working-with-services)
  topics/
    categorical-data/
      wms-and-cog/                  (was 04-categorical-data)
    time-series/
      cog-timestamps/               (from 05-time-series, manual + STAC steps)
      wms-timestamps/               (from 05-time-series, WMS steps)
    constraints/
      categorical-and-continuous/   (was 06-constraints)
  workshops/
    foss4g-uk-2026.md               Agenda for the event
```

Splitting Time Series into two tutorials is the worked example of the pattern; the same shape applies as Statistics or other topics grow.

## Content changes

**`tutorials/index.md`** — explains the two tracks: Core is the assumed baseline (topic tutorials state they expect it), Topics are independent and can be taken in any order. Table per track with a one-line "what you'll learn" and indicative duration. Closes with a short pointer to the Workshops section for people attending a live event.

**Each tutorial `index.md`** — retitled from "Exercise N" to the tutorial name, with a header line giving track (Core / Topic: Time Series), duration, and prerequisites. Existing "Key concepts" sections stay.

**Per-tutorial `01-prerequisites.md`** — core tutorials keep full setup detail; topic tutorials shorten theirs to "complete the Core track" plus anything topic-specific, so each still stands alone.

**Time Series split** — `cog-timestamps` takes the manual-timestamp and STAC-timestamp steps; `wms-timestamps` takes the WMS/WMTS time-parameter and manual-WMS steps. Each gets its own index and prerequisites page.

**`tutorials/workshops/foss4g-uk-2026.md`** — carries the welcome, project abstract, and workshop goals currently duplicated in the familiarisation index (which gets trimmed), plus running-the-day advice (two monitors, tab switching, ask questions). Then timed blocks: the three core tutorials in order, followed by a "choose your track" block listing the topic tutorials with a sentence on who each suits, then a wrap-up. Adding a future workshop is one new file plus a nav line.

## Navigation

`mkdocs.yml` replaces the `Workshop` tab with a single **Tutorials** tab:

- Overview
- `Core` group — the three core tutorials, each with its step list
- `Topics` group — topic sub-groups, each containing its tutorials
- `Workshops` group — FOSS4G UK 2026

## Technical notes

- Step content is unchanged apart from titles, prerequisite wording, and relative link fixes.
- Screenshot references shift from `../../assets/...` to `../../../assets/...` where nesting depth increases; all are verified in the rebuild.
- Old `/guide/workshops/NN-…` URLs will 404 — no redirect plugin is added, so shared links need re-sharing.
- Rebuild with `mkdocs build --strict` so broken internal links fail the build, and confirm stale `public/guide/workshops/**` output for moved pages is cleared.
