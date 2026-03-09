

## Cache COG Header Metadata

### Problem
`fetchCogHeaderMetadata` is called from multiple components (DataSourceItem, ChartSourceForm, CogMetadataDialog) and re-fires on every render/mount for the same URL.

### Approach
Add a simple in-memory URL→result cache (a `Map<string, Promise<CogMetadata>>`) inside `cogMetadata.ts`. Cache at the promise level so concurrent requests for the same URL share a single fetch.

### Changes

**`src/utils/cogMetadata.ts`**
- Add a module-level `Map<string, Promise<CogMetadata>>` called `headerMetadataCache`
- Wrap `fetchCogHeaderMetadata`: before fetching, check the cache; if present, return the cached promise. If not, create the fetch promise, store it in the cache, and return it.
- On fetch failure, remove the entry from the cache so retries work.
- Optionally export a `clearCogHeaderCache()` for testing or manual invalidation.

No changes needed in consuming components — they already call `fetchCogHeaderMetadata(url)` and will automatically benefit from the cache.

