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
│   ├── decoder-[hash].js     # All chunk files directly in version folder
│   ├── lerc-[hash].js
│   └── [all other chunk files from dist/assets/]
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

**IMPORTANT:** Your viewer bundle must be modified to support embedding. See **[EMBEDDING_GUIDE.md](./EMBEDDING_GUIDE.md)** for complete instructions.

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

### Prerequisites
- Viewer repository: `https://github.com/ESA-APEx/apex_geospatial_explorer`
- Config builder repository: `https://github.com/ormsbydaniel/apex-ge-config-builder`
- The `update-viewer-bundle.sh` script automates the build and copy process

### Workflow

#### Step 1: Prepare Viewer Repository

```bash
# Clone or navigate to viewer repository
cd ~/software/apex_geospatial_explorer

# Ensure you're on the correct branch (replace 'main' with your branch name)
git checkout main
git pull origin main

# Or for a named branch:
git checkout feature-branch-name
git pull origin feature-branch-name

# Update main.jsx and ConfigFetcher.jsx if needed
# (The script will copy these from the config builder)
```

#### Step 2: Prepare Config Builder Repository

```bash
# Navigate to config builder repository
cd ~/software/apex-ge-config-builder

# Ensure you're on the correct branch
git checkout main
git pull origin main

# Or for a named branch:
git checkout your-branch-name
git pull origin your-branch-name
```

#### Step 3: Run the Update Script

```bash
# From the config builder directory
cd ~/software/apex-ge-config-builder/public/viewer

# Edit the script to set the correct version number
# Update VERSION="3.3.3" to your new version

# Make script executable (first time only)
chmod +x update-viewer-bundle.sh

# Run the script
./update-viewer-bundle.sh
```

The script will:
1. Copy `main.jsx` and `ConfigFetcher.jsx` to viewer repo
2. Build the viewer (`npm run build`)
3. Create the version directory (e.g., `public/viewer/3.3.3/`)
4. Copy and rename bundle files
5. Copy all chunk files directly to the version folder

#### Step 4: Update versions.json

```bash
# In the config builder repo
cd ~/software/apex-ge-config-builder/public/viewer

# Edit versions.json to add the new version
# Example:
{
  "versions": ["3.3.3", "3.3.2", "3.2.1"],
  "latest": "3.3.3"
}
```

#### Step 5: Commit and Push to Config Builder

```bash
cd ~/software/apex-ge-config-builder

# Check what changed
git status

# Add new files
git add public/viewer/3.3.3/
git add public/viewer/versions.json

# Commit changes
git commit -m "Add viewer version 3.3.3"

# Push to your branch
git push origin main  # or your branch name
```

#### Step 6: Deploy

Once pushed to GitHub:
- Changes automatically sync to Lovable (if GitHub integration is enabled)
- Or deploy via Lovable's Publish button
- The new viewer version will be available in the preview dropdown

### Manual Copy Method (Alternative)

If not using the script:

```bash
# Build viewer
cd ~/software/apex_geospatial_explorer
npm run build

# Copy files to config builder
cd ~/software/apex-ge-config-builder
VERSION="X.Y.Z"
mkdir -p "public/viewer/$VERSION"

# Copy and rename main bundles
cp ~/software/apex_geospatial_explorer/dist/assets/index-*.js "public/viewer/$VERSION/bundle.js"
cp ~/software/apex_geospatial_explorer/dist/assets/index-*.css "public/viewer/$VERSION/bundle.css"

# Copy all chunk files directly to version folder
cp ~/software/apex_geospatial_explorer/dist/assets/*.js "public/viewer/$VERSION/"

# Update versions.json
# Then commit and push
```

**IMPORTANT**: Vite builds use code splitting and output chunk files. 
You MUST copy all chunk files directly into the version folder alongside bundle.js, or the viewer will fail to load.

Example file structure after copying build output:
```
public/viewer/3.2.2/
├── bundle.js              # Renamed from index-C_UgmCje.js
├── bundle.css             # Renamed from index-DfbRyVGi.css
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
