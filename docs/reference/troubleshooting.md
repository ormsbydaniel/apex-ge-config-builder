---
title: Troubleshooting
---

# Troubleshooting

Common problems when loading, editing, validating, and previewing a
configuration, and the fastest fix for each. For per-layer healthcheck
failures, jump straight to
[Run Healthcheck → Common failure modes](../services/healthcheck.md#common-failure-modes-and-what-to-do).

## Loading a config

**"Invalid configuration" toast on Load**
The JSON parsed but failed Zod schema validation. Open the
[JSON Config tab](../configuration/json-config.md), switch to **Edit
mode**, and re-apply — the validation panel lists the exact offending
field path. Most often: a renamed enum value, a removed deprecated
field, or a missing required `id`.

**Config loads but layers are missing**
Layers reference services and sources by name. If a service or source is
absent, the layer is silently skipped during sanitisation. Check the
**Services** and **Layers → Adding layers** tabs to confirm the
referenced names exist verbatim (case-sensitive).

**"Unsaved changes" prompt on every Load**
You have an editor dialog open with edits in flight. Close or save the
dialog first — see [Unsaved changes guard](keyboard-and-tips.md#unsaved-changes-guard).

## Services tab

**Service shows red — Mixed content**
The builder is served over `https://` and the service URL is `http://`.
The browser blocks the request before it leaves the page. Ask the
service owner for an HTTPS endpoint, or proxy the service.

**Service shows red — Network error**
Most often a CORS denial. Open the browser DevTools console; if you see
`No 'Access-Control-Allow-Origin' header`, the server must be configured
to allow the builder's origin.

**Service shows red — Timeout**
The endpoint is reachable but slow to respond to `GetCapabilities` /
catalogue calls. Retry with **Re-check all**. If it persists, the server
is over-loaded or firewalled — escalate to the service owner.

**STAC catalogue reports "0 collections"**
The root document parsed but contains no `collections` link. Confirm you
pasted the catalogue root and not a single collection or item URL — the
[STAC browser](../data-sources/stac-browser.md) page covers the
expected URL shapes.

## Layers tab

**Layer disappears after editing**
Saving a layer with no source assigned strips it from the active
config. Re-add the source on the layer card before saving.

**Categories or colormap not applied**
Both must be defined in `meta` first. See
[Categories and colormaps](../layers/categories.md). If the meta entry
exists but is not picked up, check the **Vector styling** or
**RGB composite** section is set to reference the correct meta name.

## Data visualisation

**RGB composite shows a black tile**
The min/max range is wrong for the data. Open the **Advanced settings**
on the RGB composite section and widen the range, or click **Auto** to
sample from the visible viewport — see
[RGB composite](../layers/rgb-composite.md).

**Pixel-values chart is empty**
The layer must use a COG data source with at least two bands. The
[Pixel values](../charts/pixel-values.md) page lists the validation
warnings the chart raises when this is not the case.

## Preview / explorer

**Preview tab is blank**
The viewer iframe failed to load. Check the browser console for a
`viewer.js` error and confirm the bundle version is reachable in
`/viewer/<version>/`. See the [GE Preview tab](../configuration/preview.md)
for version pinning.

**Deep link parameters do nothing**
Most likely a typo in the parameter name or missing `&` separator.
Re-read the [URL parameters reference](url-parameters.md) — unknown
parameters are silently ignored.

## When all else fails

1. Run [Run Healthcheck](../services/healthcheck.md) to get a
   per-layer Data Access and Performance breakdown.
2. Export the config from the **Home** tab and inspect the JSON
   directly — the [JSON Config tab](../configuration/json-config.md) is
   useful for spotting structural drift between similar layers.
3. Reproduce against the **Comprehensive demo** example (Home → Load
   → Examples) to determine if the issue is config-specific or
   builder-wide.
