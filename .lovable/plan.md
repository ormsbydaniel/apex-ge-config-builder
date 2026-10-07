# Always fetch the latest tutorials when the dialog opens

## What the user sees
- Every time the Load Configuration dialog is opened and the Tutorials tab is viewed, the list is read fresh from GitHub — a tutorial file pushed a moment earlier appears without reloading the page, and last-updated notes reflect the newest file.
- The list still appears immediately (any previously seen entries) and quietly updates itself if the fresh fetch returns something different, so there is no spinner flash on every open.
- Loading, empty and error states (including the rate-limit message and Retry button) are unchanged.

## Logic
- Two caches currently hold the list: a session-long cache inside the tutorial utility, and a 30-minute cache in the dialog's data query. Both are removed for tutorials, so every open triggers a live read.
- Examples and test configs keep their existing 5-minute caching — only tutorials change.
- Requests still happen only when the Tutorials tab is actually open, so opening the dialog on the Upload tab costs nothing.

## Technical details
- `src/utils/tutorialConfigs.ts`: delete the module-level `cache` promise and its failure-reset handling; `fetchTutorialConfigs()` performs a new `fetch(TUTORIALS_LISTING_URL)` on every call, keeping the HTTP 403/429 rate-limit message and the "unexpected response" guard. `parseTutorialListing` and its exports stay as they are.
- `src/components/config/LoadConfigDialog.tsx`: the `['tutorial-configs']` query gets `staleTime: 0`, `refetchOnMount: 'always'` and `retry: false` (so a rate-limit or offline failure surfaces at once instead of retrying against GitHub). On modal open, `queryClient.invalidateQueries({ queryKey: ['tutorial-configs'] })` is called via `useQueryClient`, so reopening the dialog always re-reads the folder even if the tab stays selected. The `enabled: open && activeTab === 'tutorials'` gate stays.
- Note for the user: an unauthenticated GitHub listing is limited to about 60 requests per hour per IP address, so each dialog open now spends one of those requests. The existing clear message and Retry button cover that case.
- Tests: add a case to `src/utils/__tests__/tutorialConfigs.test.ts` stubbing `fetch` to assert two calls to `fetchTutorialConfigs()` issue two network requests (no caching); the existing parser, latest-dated-file and sorting tests are unaffected.
