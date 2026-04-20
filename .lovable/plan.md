

## What's happening with this catalog

`https://s3.gfz-potsdam.de/.../public/catalog.json` is a **static, hierarchical STAC catalog**:

- Root `Catalog` (EOForestSTAC) → 4 child `Catalog`s (Biomass & Carbon, Disturbance & Change, Structure & Demography, Land Use & Land Cover)
- Each theme `Catalog` → child `Collection`s (e.g. `./CCI_BIOMASS/collection.json`)
- Each `Collection` → typically items + assets

So yes, child catalogs of catalogs (and potentially deeper) before reaching collections.

## Why our browser fails on it today

When `detectAndLoadStacResource` sees `type: "Catalog"`, it calls `fetchCollectionsFromCatalog()`, which **ignores the `links` array** and blindly requests `<baseUrl>/collections?limit=100`. That endpoint only exists on STAC API servers, not static catalogs — it 404s and shows a generic error. We never traverse the `child` links.

## Proposed update

Teach the browser to walk static catalog hierarchies via `rel: "child"` links, while preserving today's API-style `/collections` behavior.

### 1. Detection refinement (`detectAndLoadStacResource`)

When `data.type === 'Catalog'`:
- If it has `links` with `rel: "child"` → treat as **static catalog**, render those children directly (no network call).
- Otherwise, fall back to the current `fetchCollectionsFromCatalog()` (API-style).

### 2. New "catalog browsing" step

Add a third browser mode alongside collections/items/assets: a **catalog navigation view** that renders a list of child entries. For each `child` link:

- Resolve the href against the parent catalog URL (reuse `resolveAssetUrl` logic).
- Show title (from link `title`) + a small badge: **Catalog** or **Collection** (inferred from href ending — `collection.json` → Collection, `catalog.json` → Catalog; on click we fetch and confirm via `type`).
- Clicking a **Catalog** child → fetch it, push current onto a breadcrumb stack, render its children.
- Clicking a **Collection** child → fetch it, jump straight into the existing items view (reusing `fetchItems`).

### 3. Breadcrumb / back navigation

- Maintain a `catalogStack: { url: string; title: string }[]` so users can step back up arbitrarily deep hierarchies.
- The existing `goBack` becomes hierarchy-aware: from items → previous catalog level (not always "collections list").

### 4. Items endpoint for static collections

Static `Collection` JSONs expose items via `rel: "items"` or `rel: "item"` links rather than `/items?limit=100`. Update `getItemsUrl` (in `src/utils/stacUtils.ts`) to:
- Prefer a `rel: "items"` link from the collection's `links` array.
- Fall back to collecting `rel: "item"` links (static catalogs often inline each item as a separate link).
- Fall back to the current API-style `/collections/{id}/items?limit=100`.

When items come from inline `rel: "item"` links, fetch them lazily/in batches (start with first ~50, "Load more" fetches the next batch). This keeps perf in check for large static catalogs.

### 5. Search behavior

- In catalog view, search filters child entries by title (client-side only — no server search on static catalogs).
- Existing collection/item search remains unchanged for API mode.

### 6. Self-link & external browser links

- Continue using `getSelfLink` / `createStacBrowserUrl` for the current catalog level so users can open it in radiantearth/eoresults browser if desired.

## Out of scope (can follow up)

- Caching traversed catalogs in memory across back/forward navigation (nice-to-have for perf).
- Recursive "Add all assets from this whole subtree" — keep bulk-add scoped to one collection's items as today.

## Files touched

- `src/components/layers/components/StacBrowser.tsx` — new catalog-stack state, catalog rendering branch, breadcrumb/back logic, route to items when clicking a Collection child.
- `src/utils/stacUtils.ts` — extend `getItemsUrl` to prefer `rel: "items"` / aggregate `rel: "item"` links; small helper `getChildLinks(links)` and `inferChildKind(href)`.
- (No schema/type changes needed.)

