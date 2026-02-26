

## Root cause

`src/pages/Preview.tsx` line 32–40 builds the `viewerConfig` object sent to the viewer iframe. It includes `mapConstraints` (which references `projection: "EPSG:27700"`) but **omits the `projections` array** that contains the proj4 definitions needed to register custom CRS codes.

The viewer tries to use the projection, finds it unregistered, gets `null`, and crashes on `.getCode()`.

This works locally because the viewer reads a complete `config.json` that includes `projections`.

## Fix

### `src/pages/Preview.tsx` (~line 39)

Add `projections` to the `viewerConfig` object and its `useMemo` dependency array:

```typescript
const viewerConfig = useMemo(() => {
  const vConfig = {
    version: config.version,
    layout: config.layout,
    interfaceGroups: config.interfaceGroups,
    exclusivitySets: config.exclusivitySets,
    services: config.services,
    sources: config.sources,
    mapConstraints: config.mapConstraints,
    projections: config.projections,       // <-- add this
  };
  // ...
  return vConfig;
}, [config.version, config.layout, config.interfaceGroups, config.exclusivitySets,
    config.services, config.sources, config.mapConstraints, config.projections]);
```

One line added to the object, one dependency added to the array. No other files need changes.

