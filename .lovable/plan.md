## Goal

Restructure every workshop exercise so it has the same shape:

- The **exercise home page** contains the overview *and* the Key Concepts content.
- **Step 1** of every exercise is **"1. Pre-requisites"**, holding the setup/prereq material currently on the home page.
- All subsequent steps shift up to fill the slot vacated by the old key-concepts intro (where present).

## Per-exercise changes

### 1. Getting Started
- Move `01-key-concepts.md` content into `index.md` under a "Key concepts" section.
- Create new `01-prerequisites.md` from the current home page's Scope + Pre-requisites + Useful links + "Export often" tip.
- Delete `01-key-concepts.md`.
- Renumber `02-` through `09-` → `02-` through `09-` (no shift needed — old step 1 is replaced, positions 2–9 stay).
- Home page keeps its refreshed Steps list.

### 2. Working with Services
- No key concepts file exists yet — add a **placeholder "Key concepts"** section to `index.md` (short "TBD — to be written" note).
- Create `01-prerequisites.md` from the current home page's Pre-requisites + tip.
- Shift existing steps down by one: `01-recommended-services.md` → `02-`, `02-data-from-prr.md` → `03-`, `03-more-wms-layers.md` → `04-`, `04-wms-legends.md` → `05-`.

### 3. Categorical Data
- Move `01-categories-intro.md` content into `index.md` under "Key concepts".
- Create `01-prerequisites.md` from current home page prereqs.
- Delete `01-categories-intro.md`.
- Steps 2–5 keep their filenames and positions.

### 4. Time Series
- Move `01-time-series-intro.md` content into `index.md` under "Key concepts".
- Create `01-prerequisites.md` from current home page prereqs.
- Delete `01-time-series-intro.md`.
- Steps 2–5 keep their filenames and positions.

### 5. Constraints
- Move `01-constraints-intro.md` content into `index.md` under "Key concepts".
- Create `01-prerequisites.md` from current home page prereqs.
- Delete `01-constraints-intro.md`.
- Steps 2–3 keep their filenames and positions.

## Content pattern for `01-prerequisites.md`

```
---
title: 1. Pre-requisites
---
# Pre-requisites

<prereq paragraph from current home page>

<Useful links section, where present>

!!! tip "Export often"
    <existing tip>
```

## Content pattern for the refreshed `index.md`

```
---
title: N. <Exercise name>
---
# N. <Exercise name>

<one-paragraph scope summary>

## Key concepts

<merged from old 01-*-intro.md, OR a "TBD" placeholder for exercise 2>

## Steps

1. [Pre-requisites](01-prerequisites.md)
2. [<next>](02-...md)
...
```

## Navigation (`mkdocs.yml`)

Update the `Workshop Exercises` block so every exercise lists:

- `Overview: index.md`
- `1. Pre-requisites: 01-prerequisites.md`
- Remaining steps renumbered to match new filenames (only exercise 2 has actual filename shifts).

## Verification

- Run `mkdocs build --strict` and confirm no new warnings introduced by this restructure.

## Notes

- The "Key concepts" placeholder for exercise 2 is intentional so the shape is consistent; content can be filled in later without another restructure.
- No screenshot recapture needed — this is purely a content reorganisation.
