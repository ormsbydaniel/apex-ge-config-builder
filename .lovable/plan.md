# Fix "Loading histogram" hang when switching datasets in the multi-band window

## What I found (from reading the code; not yet reproduced)

When you pick another dataset in the multi-band window, the window clears its histograms and waits for that dataset's file details before loading new ones. A few things in this hand-over can leave a channel showing "Loading histogram…" forever:

1. **No file address for the chosen dataset.** For STAC datasets the real file link is looked up in the background. If that lookup hasn't finished, or failed for that dataset, nothing starts loading — but the channel still shows "Loading" because "no histogram yet" is treated as "loading". There's no error and no retry.
2. **Leftover requests from the previous dataset.** Requests already running for the old dataset aren't cancelled. When they finish they can drop the old dataset's histograms into the new view, or mark a band as finished while the new dataset's request is still running — so the screen and the requests get out of step.
3. **"Ready" is tracked in a way the screen doesn't react to.** The "file details ready" signal doesn't trigger a redraw, so the histogram step only starts if something else happens to change at the same moment. Switching quickly between datasets can miss it.

The fix from yesterday's flicker (looking file links up only when the files change) made the first problem more likely to show, which fits "I don't recall this before".

## Plan

1. **Confirm the cause first.** Run one short automated check with the STAC-datasets test config: open the multi-band window, switch between its datasets, and record which of the three cases above happens. No long browser sessions — just enough to confirm.
2. **Tie each histogram request to the file it was for.** Ignore results from a dataset you've already moved away from, so they can't overwrite or "finish" the new one.
3. **Make "ready" a real signal.** Histograms start loading as soon as the chosen dataset's file details arrive, however fast you switch.
4. **Show an honest state instead of an endless spinner.**
   - Still finding the file: "Finding dataset file…"
   - File couldn't be found: a short error with a Retry button.
   - Only show "Loading histogram…" while a request is actually running.
5. **Add tests** for switching datasets mid-load, switching back and forth quickly, and a STAC dataset whose file link can't be found.

## Technical details

- File: `src/components/layers/components/RgbCompositeEditorDialog.tsx`.
- Store histogram cache/loading/error state keyed by `firstCogUrl` (or stamp each request with a generation counter reset in `loadFromItem`), and drop `.then/.finally` results whose URL/generation no longer matches.
- Replace `metadataReadyUrlRef` with state (`metadataReadyUrl`) so the histogram effect re-runs when metadata finishes.
- Change `loading={histogramLoading[band] ?? !hist}` so it is only true for in-flight requests; surface `inspectionResolving` and a missing `inspectionUrls[scope]` as their own states, with retry that re-runs the inspection lookup.
- Keep the flicker fix (signature-based inspection lookup) intact.
- Tests alongside existing RGB composite dialog tests; typecheck and build as usual.
