#!/bin/bash

# Configuration
VIEWER_DIR=~/software/apex_geospatial_explorer
BUILDER_DIR=~/software/apex-ge-config-builder
GITHUB_RAW_URL="https://raw.githubusercontent.com/YOUR_USERNAME/apex-ge-config-builder/main/public/viewer"
VERSION="3.2.2"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== APEx Viewer Bundle Update Script ===${NC}"

# Step 1: Download updated files from GitHub
echo -e "\n${BLUE}Step 1: Downloading main.jsx and ConfigFetcher.jsx from GitHub...${NC}"
curl -o "$VIEWER_DIR/src/main.jsx" "$GITHUB_RAW_URL/main.jsx"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to download main.jsx${NC}"
    exit 1
fi

curl -o "$VIEWER_DIR/src/ConfigFetcher.jsx" "$GITHUB_RAW_URL/ConfigFetcher.jsx"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to download ConfigFetcher.jsx${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Files downloaded successfully${NC}"

# Step 2: Build the viewer
echo -e "\n${BLUE}Step 2: Building viewer...${NC}"
cd "$VIEWER_DIR" || exit 1
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed successfully${NC}"

# Step 3: Prepare config builder directory
echo -e "\n${BLUE}Step 3: Preparing config builder directory...${NC}"
TARGET_DIR="$BUILDER_DIR/public/viewer/$VERSION"
mkdir -p "$TARGET_DIR"
echo -e "${GREEN}✓ Target directory ready: $TARGET_DIR${NC}"

# Step 4: Copy and rename bundle files
echo -e "\n${BLUE}Step 4: Copying bundle files...${NC}"

# Find and copy the main JS bundle
MAIN_JS=$(find "$VIEWER_DIR/dist/assets" -name "index-*.js" | head -n 1)
if [ -z "$MAIN_JS" ]; then
    echo -e "${RED}Could not find main JS bundle${NC}"
    exit 1
fi
cp "$MAIN_JS" "$TARGET_DIR/bundle.js"
echo -e "${GREEN}✓ Copied $(basename $MAIN_JS) → bundle.js${NC}"

# Find and copy the CSS bundle
MAIN_CSS=$(find "$VIEWER_DIR/dist/assets" -name "index-*.css" | head -n 1)
if [ -n "$MAIN_CSS" ]; then
    cp "$MAIN_CSS" "$TARGET_DIR/bundle.css"
    echo -e "${GREEN}✓ Copied $(basename $MAIN_CSS) → bundle.css${NC}"
else
    echo -e "${BLUE}No CSS bundle found (may not be needed)${NC}"
fi

# Step 5: Copy all chunk files (assets directory)
echo -e "\n${BLUE}Step 5: Copying chunk files...${NC}"
if [ -d "$VIEWER_DIR/dist/assets" ]; then
    mkdir -p "$TARGET_DIR/assets"
    # Copy all files except the renamed ones
    for file in "$VIEWER_DIR/dist/assets"/*; do
        filename=$(basename "$file")
        # Skip the files we already renamed
        if [ "$file" != "$MAIN_JS" ] && [ "$file" != "$MAIN_CSS" ]; then
            cp "$file" "$TARGET_DIR/assets/"
            echo -e "${GREEN}✓ Copied $filename${NC}"
        fi
    done
else
    echo -e "${BLUE}No assets directory found${NC}"
fi

# Step 6: Summary
echo -e "\n${GREEN}=== Update Complete ===${NC}"
echo -e "Bundle files are ready in: ${BLUE}$TARGET_DIR${NC}"
echo -e "\nNext steps:"
echo -e "1. Commit and push changes from ${BLUE}$BUILDER_DIR${NC}"
echo -e "2. Deploy the config builder to see the updated viewer"
echo -e "\nFiles updated:"
echo -e "  - bundle.js"
echo -e "  - bundle.css (if present)"
echo -e "  - assets/* (chunk files)"
