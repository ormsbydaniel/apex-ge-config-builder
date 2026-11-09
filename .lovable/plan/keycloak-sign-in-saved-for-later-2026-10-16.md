# Keycloak sign-in for the Configuration Builder (saved for later)

Status: parked. Saved to come back to after more work on the Apps feature.

## Decisions
- **Sign-in is optional.** The builder and /apps stay fully usable without signing in (local authoring, load, export). Signing in unlocks protected features: protected ESA/APEx data in the Preview, and later saved cloud workspaces and publishing.
- **Shared client.** Use the existing `apex-explorer` Keycloak client (realm `apex`). Only split into a dedicated `apex-config-builder` client if we later need different redirect rules, scopes or roles (e.g. a "publisher" role only builders get).

## What the user will see
- A small "Sign in" button in the builder header (next to User Guide / Export) and on /apps.
- When signed in: name/initials with a menu (account, sign out).
- The Preview passes the signed-in session to the viewer so protected layers load without a second login.
- Features that need an account show a gentle "Sign in to use this" prompt instead of failing.
- Session stays alive quietly in the background; if it expires, the user is asked to sign in again without losing unsaved work.

## Steps
1. **Keycloak client setup (APEx admins):** add the builder's addresses (preview, published, sparkgeo.uk domain, localhost:8080) as allowed redirect URIs and web origins on `apex-explorer`; confirm public client + PKCE.
2. **Auth layer:** add `keycloak-js`, initialise with `check-sso` using the existing `public/silent-check-sso.html`, PKCE S256. One auth context exposes user, token, login, logout, and refreshes the token before expiry.
3. **Header controls:** Sign in / user menu in ConfigBuilder header and Apps page.
4. **Viewer handoff:** extend the iframe handshake so the Preview sends the current token (and refreshed tokens) to the viewer alongside the env from `buildViewerEnv`, instead of the viewer starting its own login. Needs agreement with the viewer bundle team on the message format.
5. **Protected-feature gating:** small helper/hook for "requires sign-in" so future features (cloud save, publish, AI build) gate consistently.
6. **Unsaved work safety:** before redirecting to Keycloak, the current config is already persisted locally; confirm it survives the round-trip.
7. **Docs:** short user-guide page on signing in and what it unlocks.

## Technical details
- Env values (URL, realm, client ID) stay in `src/config/viewerEnv.ts`; builder auth reads the same constants so builder and viewer can't drift. Move to per-environment values (dev/prod) when a prod realm is available.
- Tokens kept in memory only (not localStorage); never written into configs or exports.
- No Lovable Cloud needed for login itself; cloud workspaces/publishing would later call APEx APIs (e.g. dispatcher) with the bearer token.
- Record the auth architecture rule in `AGENTS.md` when implemented.

## Open questions for later
- Exact redirect URIs the APEx team will allow on `apex-explorer`.
- Does the viewer accept an injected token, or must it be updated?
- Which features first require sign-in (cloud save, publish, Build with AI)?
