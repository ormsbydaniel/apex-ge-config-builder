# Keep tutorials fresh without reloading unchanged files

## What the user sees
- Each time the Load Configuration dialog opens on the Tutorials tab, the list is checked against GitHub, so a newly pushed dated file (e.g. `tutorial-3-completion_20261007_1700.json`) shows up straight away with its new last-updated note.
- Entries already seen appear instantly. Only entries with a newer date stamp change.
- Clicking a tutorial whose file hasn't changed since it was last loaded reuses the copy already in memory. Only a tutorial with a newer date stamp is downloaded again.
- Loading, empty, error, rate-limit and Retry behaviour are unchanged.

## Logic
- Finding out whether a newer date stamp exists still takes one small folder-listing request per open. That request contains only file names, not their contents. Tutorial files themselves are never downloaded ahead of time.
- In memory, keep the latest file name for each tutorial and kind, plus the downloaded content of each tutorial file, stored by its exact file name.
- When the listing comes back, compare it with the stored names. If a tutorial and kind now has a fresher date stamp, its entry is updated and its old stored content is dropped. Unchanged entries are left as they are.
- If the listing request fails, for example because GitHub limits requests, the list already in memory stays visible with a small notice. The full error panel only appears if nothing has loaded yet.
- Memory lasts for the browser session. Reloading the page starts fresh.
- Examples and test configs keep their current caching.

## Technical details
- `src/utils/tutorialConfigs.ts`:
  - Remove the session-long promise cache. `fetchTutorialConfigs()` always reads the listing, but merges it into a module-level `Map<"N-kind", TutorialConfigEntry>` and keeps an existing entry object when its `fileName` hasn't changed, so the rendered list stays stable.
  - Add `getTutorialConfigText(entry)`. It returns stored JSON text from `Map<fileName, string>`, or fetches `entry.url` once and stores it. Stored text for older file names of the same tutorial and kind is evicted.
  - Export `__resetTutorialCache()` for tests.
- `LoadConfigDialog.tsx`:
  - The tutorials query uses `staleTime: 0`, `refetchOnMount: 'always'`, `retry: false` and `placeholderData` from the previous result. On open it calls `invalidateQueries(['tutorial-configs'])`.
  - Tutorial clicks get the text via `getTutorialConfigText`, then go through the existing `importConfig` path as an in-memory `File`, with the same label, validation, error dialog and unsaved-changes guard. The source is recorded as `{ type: 'example', label }` as it is today.
- GitHub allows about 60 unauthenticated listing requests per hour per IP address. Each open now uses one listing request, but no file downloads.
- Tests (`tutorialConfigs.test.ts`, with a stubbed `fetch`):
  - Repeated listings keep unchanged entries.
  - A newer date stamp replaces the entry and evicts the old stored content.
  - Content is downloaded only once per file name.
  - The existing parser tests are unchanged.
