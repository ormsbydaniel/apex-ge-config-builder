# STAC property filters from collection queryables

## Goal

Let users filter a STAC items endpoint by collection-specific properties (for example cloud cover, platform, or orbit) using the fields the collection advertises in its `queryables` response. As with bbox, datetime and limit, the data-source URL remains the only saved record of the query.

## User experience

1. Add a **+ Add property filter** action next to the existing limit, date and bbox actions. It is enabled only when the source is a queryable items endpoint.
2. The dialog lists the collection's queryables (key, title and type label, as on the metadata Queryables tab), excluding `datetime` and geometry fields, which have dedicated controls.
3. After choosing a property:
   - **Operator** options depend on type: numbers and dates offer `=`, `≠`, `<`, `≤`, `>`, `≥`, and between; strings offer `=`, `≠`, and contains (`LIKE`); enumerated values offer equals and is any of; booleans offer is true and is false.
   - **Value** uses a suitable input: number (respecting the advertised minimum and maximum), date/time, text, a dropdown for enumerated values, or a multi-select for "is any of".
4. Each saved rule appears as its own badge, such as `eo:cloud_cover ≤ 20`. Clicking a badge reopens it for editing, and its remove button deletes only that rule. Rules are combined with AND.
5. If a collection publishes no queryables, or the request fails, the dialog falls back to manual entry. Users can type a property key, choose a type and enter a value, with a short note explaining that the fields could not be discovered.
6. If an existing URL contains a filter the editor cannot break into rules, such as one using OR or functions, it appears as a single **Custom filter** badge. Its dialog has an editable raw CQL2 text field and a warning that it will be kept exactly as entered. Guided rules cannot be added alongside it until it is removed.
7. Server support caveat: some APIs advertise queryables but reject `filter` on the items endpoint. The healthcheck already fetches the items URL, so these errors appear there. Also add a quick **Test filter** button in the dialog that runs the query once and shows the number of matches or the server's error message.

## Saved form

Property filters are written to the items URL as standard OGC API Features Part 3 parameters, and other parameters are left unchanged:

```text
.../collections/sentinel-2-l2a/items?limit=50&filter=eo%3Acloud_cover%20%3C%3D%2020%20AND%20platform%20%3D%20%27sentinel-2a%27&filter-lang=cql2-text
```

When the last rule is removed, both `filter` and `filter-lang` are removed. There are no configuration, schema or type changes.

## Technical details

- **`src/utils/stacQuery.ts`** (keeps the AGENTS.md rule that filters are encoded only in the URL):
  - `StacPropertyRule { property, type, operator, value }`.
  - `serialiseCql2Rules(rules)`: quote and escape strings, use `TIMESTAMP('…')` for dates, `BETWEEN`, `IN (…)`, `LIKE '%…%'`, and join rules with ` AND `.
  - `parseStacCql2Filter(url)` returns `{ rules } | { raw }`. It splits top-level AND clauses only when every clause matches a supported pattern; otherwise it returns the raw text.
  - `updateStacCql2Filter(url, rules | raw | undefined)` sets or removes `filter` and `filter-lang` and preserves all other parameters.
  - `operatorsForQueryable(q)` maps type, format and enum information to the allowed operators.
- **Queryables fetch:** reuse `fetchStacQueryables` and `summariseStacQueryables` from `src/utils/stacMetadata.ts`, with a module-level cache keyed by collection URL. The metadata tab and editor then share a single request per session.
- **`StacQueryEditor.tsx`:** add the property-filter action, rule badges, a custom-filter badge and one `PropertyFilterDialog` (a new small component in the same folder) that follows the existing dialog pattern. Rules continue to be derived from the URL on every render, so reopening an existing source repopulates them.
- **Display:** the layer-row tooltip already shows the full URL, so no change is needed. Update `docs/data-sources/stac-browser.md` with a short "Property filters" section.

## Verification

- Unit tests in `stacQuery.test.ts`: serialisation and round trips for each operator and type, quote escaping, AND splitting, raw fallback for OR/functions, removal clearing both parameters, and preservation of bbox, datetime, limit and unrelated parameters.
- Test the operator mapping for number, string, enum, boolean and date-time queryables.
- Run the typecheck. Preview checks are left to you, using the Sentinel-2 entries in the stac-datasets fixture.

## Not included

- OR groups or nested logic in the guided builder (these remain available through the raw filter text).
- CQL2-JSON, `/search` POST bodies and spatial predicates such as `S_INTERSECTS`.
- Map-drawn areas.
