# Fix: signing in silently fails when a draft is open

## The problem (confirmed in code)
When you click Sign in with work open, the builder saves your draft and a "return to this page" marker, then goes to Keycloak. On return to the sign-in page (`/callback`), draft restore runs straight away and jumps back to your saved page. That jump usually happens before Keycloak has read the sign-in code from the address bar, so the code is lost and you land back signed out — every time.

## The fix
Wait until sign-in has finished before moving away from the sign-in return page.

1. In the draft autosave hook, restore the draft contents immediately as now (so nothing is lost), but hold back the "go to saved page" step.
2. Only perform that navigation once sign-in reports it is ready (success or failure). If you're not on the sign-in return page, navigate as before — no change for normal reloads.
3. Use `replace` for that navigation so Back doesn't return to the sign-in page.
4. The sign-in return page keeps its fallback (go home after 1s if still there), which now only triggers when there was no saved page.

## Tests
Add a test for the autosave hook: with a saved draft and marker, on `/callback` with auth not ready, no navigation happens; once auth becomes ready, it navigates to the saved page. Off `/callback`, it navigates immediately as before.

## Technical details
- `src/hooks/useDraftAutosave.ts`: call `useAuth()`; store the pending `marker.route` in a ref/state instead of calling `navigate` in the mount effect; a separate effect navigates when `pendingRoute && (auth.ready || !pathname.endsWith('/callback'))`, then clears it.
- `DraftPersistence` is already inside `AuthProvider` in `App.tsx`, so `useAuth()` is available.
- No changes to `keycloak.ts`, `AuthContext.tsx` or `draftStorage.ts`.
- Resolve the Project monitoring finding as fixed afterwards.
