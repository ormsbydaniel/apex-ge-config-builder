# Viewer Bundle Integration

This directory contains versioned builds of the map viewer application.

## Directory Structure

Each viewer version should be placed in its own semantic versioned directory:

```
public/viewer/
├── versions.json       # Manifest file listing available versions (REQUIRED)
├── 3.2.2/
│   ├── bundle.js      # Renamed from index-[hash].js
│   ├── bundle.css     # Renamed from index-[hash].css (optional)
│   └── [all other chunk files from build] # Copy ALL files from your build output
├── 3.2.1/
│   └── bundle.js
└── 3.1.0/
    └── bundle.js
```

**IMPORTANT**: If your viewer build uses code splitting (multiple JS chunks), you MUST copy ALL the generated files from your build directory, not just the main index file. The bundle.js will reference these chunks.

## versions.json Manifest

The `versions.json` file is required and lists all available viewer versions:

```json
{
  "versions": ["3.2.2", "3.2.1", "3.1.0"],
  "latest": "3.2.2"
}
```

## Viewer Bundle Requirements

Your viewer bundle must expose one of the following initialization methods:

### Option 1: Global Function (Recommended)
```javascript
// Your viewer bundle should expose:
window.initApexViewer = function(containerElement) {
  // Fetch config from /config.json
  fetch('/config.json')
    .then(response => response.json())
    .then(config => {
      // Initialize your map viewer with the config
      // Render into the containerElement
    });
};
```

### Option 2: Global API Object
```javascript
// Your viewer bundle should expose:
window.ApexViewer = {
  init: function(containerElement) {
    // Fetch config from /config.json
    fetch('/config.json')
      .then(response => response.json())
      .then(config => {
        // Initialize your map viewer
      });
  },
  destroy: function() {
    // Cleanup when viewer is unmounted (optional)
  }
};
```

## Config Endpoint

The configuration is served at `/config.json` and includes:
- Live, sanitized configuration from the config builder
- Automatically updated when changes are made in the builder
- URLs properly formatted and validated

Example:
```json
{
  "version": "1.0.0",
  "layout": { ... },
  "interfaceGroups": [ ... ],
  "services": [ ... ],
  "sources": [ ... ]
}
```

## Adding New Versions

1. Build your viewer application (e.g., `npm run build` or `vite build`)
2. Create a new directory with the semantic version number: `public/viewer/X.Y.Z/`
3. **Copy the build output with this structure:**
   ```bash
   # Copy main bundle files (rename the index files)
   cp dist/index-[hash].js public/viewer/X.Y.Z/bundle.js
   cp dist/index-[hash].css public/viewer/X.Y.Z/bundle.css
   
   # Create assets directory and copy all chunk files
   mkdir -p public/viewer/X.Y.Z/assets
   cp dist/assets/*.js public/viewer/X.Y.Z/assets/
   ```
4. **Update `versions.json`** to include the new version in the `versions` array

**IMPORTANT**: Vite builds use code splitting and output chunk files to an `assets/` subdirectory. 
You MUST create the `assets/` directory and copy all chunk files into it, or the viewer will fail to load.

Example file structure after copying build output:
```
public/viewer/3.2.2/
├── bundle.js              # Renamed from index-C_UgmCje.js
├── bundle.css             # Renamed from index-DfbRyVGi.css
└── assets/                # Chunk files MUST be in assets/ subdirectory
    ├── basedecoder-B2c5_Eok.js
    ├── deflate-Dthki0TA.js
    ├── decoder-tqM1uIvc.js
    ├── jpeg-JhJy4lL1.js
    ├── lerc-90F9mSzm.js
    ├── lzw-_aCqfs4w.js
    ├── packbits-DDWKfGV_.js
    ├── pako.esm-BkaqWuDM.js
    ├── raw-in9isEBO.js
    └── webimage-DBgUwIbt.js
```

## Version Selection

- The most recent version (by semantic versioning) will be selected by default
- Users can select different versions from the dropdown in the preview page
- The selected version is saved to localStorage for persistence

## Development Workflow

For local development:
1. Build your viewer app
2. Copy the output to `public/viewer/{version}/`
3. Refresh the preview page to load the new version

For production deployment:
1. Include versioned viewer bundles in your deployment
2. Users can preview configurations against different viewer versions
