

# Updating the Viewer Integration for TanStack Router

## Background

The viewer application is moving from a `ConfigFetcher` component with a `window.initApexViewer()` global function to TanStack Router (`RouterProvider` + `createRouter`). This fundamentally changes how the viewer initializes -- it no longer exposes a callable function for embedding. Instead, it self-renders into `#root` and manages its own routing.

## Current Architecture

The config builder currently:
1. Loads `bundle.js` via a script tag (`useViewerLoader.ts`)
2. Calls `window.initApexViewer(container, { config })` to pass the config object directly
3. The viewer's `ConfigFetcher` accepts this config prop and skips fetching `/config.json`

## Problem

The new viewer bundle will:
- Self-initialize using TanStack Router -- no `window.initApexViewer` export
- Use file-based routing (`routeTree.gen`) that expects to control the full page
- Fetch its own config from `/config.json` if no config is provided directly

Injecting a full TanStack Router app into a div inside the config builder's own React tree will cause conflicts (two routers, two React roots competing for the same DOM).

## Proposed Solution: iframe-based Embedding

Switch the Preview page to load the viewer in an iframe. The viewer runs independently and fetches its config from the config builder via a proper JSON endpoint.

### Changes Required

#### 1. Update `public/viewer/main.jsx`
Replace the current `ConfigFetcher`-based code with the new TanStack Router version provided by the user. This file serves as the reference entry point for viewer bundles.

#### 2. Create a proper JSON API endpoint for config
The current `/config.json` route renders an HTML page (a React component with `<pre>` tags). The viewer's `fetch("/config.json")` expects raw JSON. 

**Solution**: Add a Vite middleware or a simple handler that serves the config as actual `application/json` at a known path. Alternatively, the Preview page can write the config into the iframe via `postMessage`.

**Recommended approach -- postMessage**:
- Avoids needing a real JSON API endpoint
- The Preview page posts the config to the iframe after it loads
- The viewer's main.jsx is updated to listen for a `postMessage` with config data, and passes it to the router context or a global store

#### 3. Rewrite `useViewerLoader.ts`
Replace the script-injection + global-function approach with iframe management:
- Create an iframe pointing to a lightweight HTML bootstrap page (e.g., `/viewer/{version}/index.html`)
- After iframe loads, post the config via `postMessage`
- Listen for ready/error messages back from the iframe
- Handle cleanup by removing the iframe

#### 4. Create a bootstrap HTML file for each viewer version
Each version directory needs a small `index.html` that:
- Includes the CSS link
- Loads the bundle as a module script
- The bundle self-initializes (as the new main.jsx does)

#### 5. Update `public/viewer/main.jsx` to accept config via postMessage
Add a `message` event listener that receives config from the parent window and injects it into the router context or Jotai store before/during initialization. This bridges the gap between the config builder passing config and the self-initializing viewer.

#### 6. Update `src/types/viewer.ts`
Remove the `initApexViewer` global type declaration since it will no longer be used.

#### 7. Update Preview page (`src/pages/Preview.tsx`)
- Remove the `VIEWER_CONTAINER_ID` div
- Render an iframe instead, sized to fill the preview area
- After iframe loads, post the current `viewerConfig` to it
- Re-post config whenever it changes (for live preview updates)
- Keep the version selector and status indicators

#### 8. Clean up `useViewerLoader.ts`
- Remove script tag injection, `window.initApexViewer` references, and CSS link injection
- Replace with iframe src management and postMessage communication

### Files to Modify
- `public/viewer/main.jsx` -- replace with TanStack Router version + postMessage listener
- `src/hooks/useViewerLoader.ts` -- rewrite for iframe-based loading
- `src/pages/Preview.tsx` -- switch from container div to iframe
- `src/types/viewer.ts` -- remove obsolete global declarations

### Files to Create
- `public/viewer/viewer-host.html` -- generic bootstrap HTML that loads versioned bundles (or one `index.html` per version directory)

### Considerations
- **Live config updates**: postMessage allows re-sending config whenever the user makes changes in the config builder, maintaining the live preview capability
- **Cross-origin**: Since the iframe loads from the same origin, postMessage works without CORS issues
- **Version switching**: Changing the iframe `src` to a different version directory handles version switching naturally
- **Error handling**: The iframe can post error messages back to the parent for display in the status bar
- **Existing viewer versions**: Older bundles (3.3.x, 3.4.x, 3.5.0) still use `window.initApexViewer`. A backward-compatible approach could try the old method first and fall back to iframe for newer versions, or we accept that older versions will need the old loader

