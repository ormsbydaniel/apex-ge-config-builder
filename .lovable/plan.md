## Goal

Make the documentation clearly distinguish the three different roles a service can play, so authors understand what actually ends up in the saved config and why.

## The three service roles to communicate

1. **Service-as-data-source (live endpoint reference)** — WMS, WMTS, WFS. The chosen layer from the service is the data source; the config keeps a live reference to the service URL plus a layer name. Changing the service URL changes what the layer renders.

2. **Service-as-discovery-aid (browser only)** — STAC catalogues and S3 buckets. The service is a convenience for *finding* assets in the config builder UI. What gets saved into the config is the resolved, direct URL to the underlying COG / GeoJSON / FlatGeoBuf / CSV. The service entry is not required at runtime — deleting it after layers are configured does not break those layers.

3. **Service-as-data-source via STAC collection (future)** — referencing a STAC collection itself as the data source, so the collection drives behaviour like the temporal control's time-series. Flagged as forthcoming.

## Proposed documentation changes

### 1. `docs/services/index.md` — rewrite the framing

Replace the current "A service is a reusable endpoint definition…" opener with an explicit **"How services are used"** section that names the three roles above, ideally as a small table:

| Service type | Role | What gets saved in the config |
|---|---|---|
| WMS / WMTS / WFS | Live endpoint reference | The service URL + chosen layer name |
| STAC catalogue | Discovery aid in the builder | The resolved direct URL to each picked asset (COG, GeoJSON, etc.) |
| S3 bucket | Discovery aid in the builder | The resolved direct URL to each picked file |
| STAC collection (future) | Live collection reference, drives temporal control | The collection URL |

Update the existing "When to use services vs. direct URLs" section so it no longer implies STAC/S3 work the same way as WMS/WMTS — clarify that for STAC/S3 the service is purely a builder convenience and can be removed afterward.

Drop the misleading line "swap an endpoint URL in one place and have every layer that uses it pick up the change" from the intro — that is only true for WMS/WMTS/WFS, not STAC/S3.

### 2. `docs/getting-started/index.md` — tighten the Service definition

Expand the **Service** core-concept paragraph to a short two-sentence version that distinguishes:
- WMS/WMTS/WFS services are referenced live by layers.
- STAC and S3 services are mainly a way to *browse and pick* assets in the builder; the resolved file URL is what is stored.

Mention forthcoming STAC-collection-as-data-source support in one sentence.

### 3. `docs/services/adding-services.md` — per-type clarification

Under each "Type-specific tips" subsection, add a one-line **"What gets saved"** note:

- **WMS / WMTS / WFS** — "The config stores the service URL plus the chosen layer name. Editing the service URL re-points every layer that uses it."
- **STAC** — "Used to browse the catalogue in the builder. When you add an item, the resolved asset URL is written into the layer; the STAC service entry itself is not required at runtime."
- **S3** — Same pattern as STAC: discovery only, resolved file URL is saved.
- Add a short "**Coming soon**" note that STAC collections will be able to act as a live data source feeding the temporal control.

### 4. `docs/data-sources/stac-browser.md` and `docs/data-sources/s3-browser.md` — reinforce the model

Add a short callout near the top of each:

> The STAC catalogue / S3 bucket is a browsing aid only. When you select an asset, the config stores its resolved URL directly — you can delete the catalogue/bucket entry afterward without breaking layers that were built from it.

### 5. `docs/reference/glossary.md` — split the "Service" entry

Update the glossary entry for **Service** to note the two current modes (live reference vs. discovery aid) and flag the third (STAC collection as data source) as forthcoming, so the distinction lives in one canonical place.

### 6. Defer until shipped

Do **not** write a dedicated "STAC collection as a data source" page yet — only seed the forward references above. When the feature lands, add a focused page under `docs/data-sources/` and link from the Services overview table.

## Out of scope

- No code changes.
- No changes to recipes (they already work against the resolved URLs).
- No mkdocs nav changes.
