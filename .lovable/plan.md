

## Adding a Modal Error Boundary

### Why

Modals (`ServiceSelectionModal`, `StacBrowser`, `LoadConfigDialog`, `LegendEditorDialog`, etc.) currently have no error containment. When something inside a dialog throws — like the recent "Rendered more hooks than during the previous render" crash in `ServiceSelectionModal` — the error bubbles to `ConfigErrorBoundary` in `ConfigBuilder.tsx`, which **unmounts the entire app** and shows a full-page reload screen. The user loses unsaved config state and all context.

A modal-scoped error boundary would isolate the failure to the dialog itself: show an inline error inside the modal, let the user close it, and leave the rest of the app untouched.

### What it involves

**1. New component: `src/components/common/ModalErrorBoundary.tsx`**

A thin specialization of the existing `CompositionErrorBoundary` from `src/utils/errorHandling.ts`, tailored for dialog content:

- Class component with `getDerivedStateFromError` / `componentDidCatch`
- On error, renders a fallback inside the existing `<DialogContent>` slot:
  - Title: "Something went wrong in this dialog"
  - The error message (collapsible "Details" with stack in dev only)
  - **Try again** button (resets boundary state — useful for transient issues like a failed fetch)
  - **Close** button (calls a passed-in `onClose` so the parent can dismiss the modal cleanly)
- Logs to console and optionally toasts (off by default — the inline UI is the primary signal)
- Resets its `hasError` state when its `resetKey` prop changes (so reopening the modal starts fresh even if the user dismisses without clicking Try again)

```tsx
<ModalErrorBoundary onClose={handleClose} resetKey={isOpen ? service?.id : 'closed'}>
  {children}
</ModalErrorBoundary>
```

**2. Wrap the body of each high-risk modal**

Wrap the *contents* of `<DialogContent>` (not the `<Dialog>` itself — the boundary must live inside the portal so the fallback renders in the dialog). Targets, in priority order:

- `src/components/layers/components/ServiceSelectionModals.tsx` — most likely to crash (lazy capability fetches, third-party data shapes from STAC/S3)
- `src/components/layers/components/StacBrowser.tsx` consumers — already deeply nested, hierarchical catalog parsing can throw on malformed responses
- `src/components/config/LoadConfigDialog.tsx` — file parsing, GitHub API, abortable fetches
- `src/components/form/LegendEditorDialog.tsx` and `src/components/layers/components/BandLabelEditorDialog.tsx` — lower priority, simpler internals

For each: import `ModalErrorBoundary`, wrap the JSX inside `<DialogContent>`, pass `onClose` and a `resetKey` derived from the open/identifying prop.

**3. Keep the global boundary**

`ConfigErrorBoundary` in `ConfigBuilder.tsx` stays as the last-resort full-page catcher for crashes outside modals. The modal boundary catches *first* because it's deeper in the tree.

### What it does NOT involve

- No changes to `useLazyServiceCapabilities`, `useConfigImport`, or any business logic — async errors there are already handled via try/catch + toasts. The boundary only catches **render-phase** exceptions (hook violations, undefined property access during render, third-party component throws).
- No new dependency — reuses React's built-in error boundary mechanism already used by `CompositionErrorBoundary`.
- No changes to the dialog primitive (`src/components/ui/dialog.tsx`).

### Files touched

- `src/components/common/ModalErrorBoundary.tsx` *(new, ~60 lines)*
- `src/components/layers/components/ServiceSelectionModals.tsx` — wrap body
- `src/components/config/LoadConfigDialog.tsx` — wrap body
- *(Optional, follow-up)* `StacBrowser`, `LegendEditorDialog`, `BandLabelEditorDialog`

### Trade-offs

- **Pro**: A future hook-order bug or malformed STAC response no longer wipes the user's session — they just close the modal and retry.
- **Pro**: "Try again" gives a recovery path for transient async-during-render errors without a page reload.
- **Con**: Adds a small wrapper to each dialog (~3 lines per modal). Negligible.
- **Con**: Error boundaries don't catch errors in event handlers or async code — those still need try/catch (already in place via `safeAsync` / `handleAsyncError`). The boundary is purely a render-phase safety net.

