# Embedding Your Viewer Application

## The Problem

Your current viewer build is a standalone React application that auto-renders on load. The config builder needs your viewer to:
1. **Not auto-render** when the script loads
2. **Expose a global initialization function** that can be called with a container element
3. **Fetch configuration** from `/config.json` before initializing

## Solution: Modify Your Viewer's Entry Point

### Current Setup (Won't Work)

Your viewer probably has a `main.tsx` or `index.tsx` that looks like this:

```typescript
// ❌ This auto-renders and doesn't support embedding
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById("root")!).render(<App />);
```

### Required Changes

You need to expose a global initialization function instead:

```typescript
// ✅ This supports embedding
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Expose global initialization function
window.initApexViewer = (container: HTMLElement) => {
  console.log('[ApexViewer] Initializing viewer in container:', container);
  
  // Fetch the configuration from the config builder
  fetch('/config.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }
      return response.json();
    })
    .then(config => {
      console.log('[ApexViewer] Config loaded:', config);
      
      // Render your app into the provided container
      createRoot(container).render(<App config={config} />);
    })
    .catch(error => {
      console.error('[ApexViewer] Failed to initialize:', error);
      container.innerHTML = `
        <div style="padding: 20px; color: red; font-family: sans-serif;">
          <h3>Failed to load viewer</h3>
          <p>${error.message}</p>
        </div>
      `;
    });
};

console.log('[ApexViewer] Bundle loaded, waiting for initialization call');
```

### TypeScript Types

Add this to your viewer's type definitions (e.g., `src/vite-env.d.ts`):

```typescript
interface Window {
  initApexViewer?: (container: HTMLElement) => void;
  ApexViewer?: {
    init: (container: HTMLElement) => void;
    destroy?: () => void;
  };
}
```

## App Component Changes

Your `App` component needs to accept the config as a prop:

```typescript
// Before
function App() {
  // Had to fetch config internally or use hardcoded config
  return <MapViewer />;
}

// After
interface AppProps {
  config: any; // Or use your Config type
}

function App({ config }: AppProps) {
  return <MapViewer config={config} />;
}

export default App;
```

## Alternative: ApexViewer API Object

If you prefer, you can expose an API object instead of a single function:

```typescript
let viewerRoot: ReturnType<typeof createRoot> | null = null;

window.ApexViewer = {
  init: (container: HTMLElement) => {
    console.log('[ApexViewer] Initializing...');
    
    fetch('/config.json')
      .then(response => response.json())
      .then(config => {
        viewerRoot = createRoot(container);
        viewerRoot.render(<App config={config} />);
      })
      .catch(error => {
        console.error('[ApexViewer] Init failed:', error);
      });
  },
  
  destroy: () => {
    console.log('[ApexViewer] Destroying viewer');
    if (viewerRoot) {
      viewerRoot.unmount();
      viewerRoot = null;
    }
  }
};
```

## Vite Build Configuration

Make sure your `vite.config.ts` is set up correctly:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Important: Don't use library mode, build as a regular app
    outDir: 'dist',
    
    // Optional: Customize chunk names for easier tracking
    rollupOptions: {
      output: {
        entryFileNames: 'index-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
```

## Testing Your Changes

### 1. Test Locally (Standalone)

Create a test HTML file to verify your viewer works in embedded mode:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Viewer Test</title>
  <link rel="stylesheet" href="/dist/index-[hash].css">
</head>
<body>
  <div id="viewer-container" style="width: 100vw; height: 100vh;"></div>
  
  <script src="/dist/index-[hash].js"></script>
  <script>
    // Mock config for testing
    const mockConfig = {
      version: "1.0.0",
      layout: { /* ... */ },
      interfaceGroups: [ /* ... */ ],
      services: [ /* ... */ ],
      sources: [ /* ... */ ]
    };
    
    // Override fetch to return mock config
    const originalFetch = window.fetch;
    window.fetch = (url) => {
      if (url === '/config.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockConfig)
        });
      }
      return originalFetch(url);
    };
    
    // Wait for bundle to load, then initialize
    window.addEventListener('load', () => {
      const container = document.getElementById('viewer-container');
      if (window.initApexViewer) {
        window.initApexViewer(container);
      } else {
        console.error('initApexViewer not found!');
      }
    });
  </script>
</body>
</html>
```

### 2. Test in Config Builder

1. Build your viewer: `npm run build`
2. Copy files to config builder:
   ```bash
   # In your viewer project
   VERSION="3.2.2"
   
   # Copy to config builder (adjust paths as needed)
   cp dist/index-*.js ../config-builder/public/viewer/$VERSION/bundle.js
   cp dist/index-*.css ../config-builder/public/viewer/$VERSION/bundle.css
   mkdir -p ../config-builder/public/viewer/$VERSION/assets
   cp dist/assets/* ../config-builder/public/viewer/$VERSION/assets/
   ```
3. Update `versions.json` if adding a new version
4. Navigate to `/preview` in the config builder
5. Check browser console for initialization messages

## Common Issues

### Issue: "initApexViewer is not defined"

**Cause:** Your initialization function isn't being exposed to the global scope.

**Fix:** Make sure you're assigning to `window.initApexViewer` at the top level of your entry file, not inside a function or conditional.

### Issue: Viewer renders in wrong container

**Cause:** Your app is still trying to find an element with id="root"

**Fix:** Use the container passed to `initApexViewer`, don't query for elements.

### Issue: Config is undefined

**Cause:** Your App component isn't receiving the config prop properly.

**Fix:** Make sure you're passing the config when rendering: `<App config={config} />`

### Issue: Assets/chunks not loading (404 errors)

**Cause:** Chunk files aren't in the correct location.

**Fix:** Make sure all files from `dist/assets/` are copied to `public/viewer/X.Y.Z/assets/` (not the root viewer directory).

## Debugging Checklist

✅ Bundle loads without errors  
✅ Console shows: "Bundle loaded, waiting for initialization call"  
✅ `window.initApexViewer` is defined (check in browser console)  
✅ Initialization function is called with a container element  
✅ Config is fetched successfully from `/config.json`  
✅ App renders into the provided container  
✅ No 404 errors for chunk files in Network tab  
✅ All assets are in the `assets/` subdirectory  

## Example Complete Entry File

Here's a complete example of a properly configured entry file:

```typescript
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// TypeScript will recognize this from vite-env.d.ts
window.initApexViewer = (container: HTMLElement) => {
  console.log('[ApexViewer] Initializing in container:', container);
  
  // Show loading state
  container.innerHTML = '<div style="padding: 20px;">Loading viewer...</div>';
  
  // Fetch configuration
  fetch('/config.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(config => {
      console.log('[ApexViewer] Loaded config:', {
        version: config.version,
        interfaceGroupCount: config.interfaceGroups?.length || 0,
        serviceCount: config.services?.length || 0,
        sourceCount: config.sources?.length || 0
      });
      
      // Clear loading state and render app
      container.innerHTML = '';
      const root = createRoot(container);
      root.render(<App config={config} />);
      
      console.log('[ApexViewer] Viewer initialized successfully');
    })
    .catch(error => {
      console.error('[ApexViewer] Initialization failed:', error);
      container.innerHTML = `
        <div style="
          padding: 40px;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <h2 style="color: #dc2626; margin-bottom: 16px;">
            Failed to Load Viewer
          </h2>
          <p style="color: #6b7280; margin-bottom: 8px;">
            ${error.message}
          </p>
          <details style="margin-top: 16px; text-align: left;">
            <summary style="cursor: pointer; color: #3b82f6;">
              Technical Details
            </summary>
            <pre style="
              margin-top: 8px;
              padding: 12px;
              background: #f3f4f6;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 12px;
            ">${error.stack || error.message}</pre>
          </details>
        </div>
      `;
    });
};

// Log when bundle is ready
console.log('[ApexViewer] Bundle loaded successfully');
console.log('[ApexViewer] Waiting for initialization call');
console.log('[ApexViewer] Available methods:', Object.keys(window).filter(k => k.includes('Apex')));
```

## Next Steps

1. **Modify your viewer's entry file** (main.tsx/index.tsx) using the examples above
2. **Update your App component** to accept config as a prop
3. **Rebuild your viewer**: `npm run build`
4. **Copy the build output** to the config builder as described in README.md
5. **Test in the preview page** at `/preview`

Need help with a specific step? Check the debugging checklist above or review the console logs for clues.
