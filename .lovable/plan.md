

## Plan: Add "URL Parameters" Section to Settings Tab

Add a new section beneath the Footer Links section in `SettingsTab.tsx` with a descriptive paragraph and a two-column table showing URL parameters and examples.

### Changes

**File: `src/components/config/SettingsTab.tsx`**

After the Footer Links `</div>` (line 900), insert a new "URL Parameters" section containing:
- An `<h3>` heading: "URL Parameters"
- A paragraph explaining these are URL parameters for deployed configurations
- A `Table` using the existing shadcn table components with two columns: "Parameter" and "Examples"
- Five rows of data:
  - `variant=<fullscreen|standard>` | `&variant=fullscreen`
  - `zoom=<zoomlevel>` | `&zoom=10`
  - `layerGroups=<groupname>` | `&layerGroups=Soils&layerGroups=Cities`
  - `lat=<latitude>` | `&lat=52.0`
  - `long=<longitude>` | `&long=-2.0`
- Parameter/example values styled in monospace (`font-mono`) for clarity

Will import `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` from `@/components/ui/table` at the top of the file.

