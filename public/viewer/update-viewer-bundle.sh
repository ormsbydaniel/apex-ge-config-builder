#!/bin/bash

# Configuration
VIEWER_DIR=~/software/apex_geospatial_explorer
BUILDER_DIR=~/software/apex-ge-config-builder
VERSION="3.4.0"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== APEx Viewer Bundle Update Script ===${NC}"

# Step 1: Copy updated files from config builder to viewer
echo -e "\n${BLUE}Step 1: Copying main.jsx and ConfigFetcher.jsx to viewer...${NC}"
cp "$BUILDER_DIR/public/viewer/main.jsx" "$VIEWER_DIR/src/main.jsx"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to copy main.jsx${NC}"
    exit 1
fi

cp "$BUILDER_DIR/public/viewer/ConfigFetcher.jsx" "$VIEWER_DIR/src/ConfigFetcher.jsx"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to copy ConfigFetcher.jsx${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Files copied successfully${NC}"

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

# Step 5: Copy all chunk files directly to version folder
echo -e "\n${BLUE}Step 5: Copying chunk files...${NC}"
if [ -d "$VIEWER_DIR/dist/assets" ]; then
    # Copy all files except the renamed ones
    for file in "$VIEWER_DIR/dist/assets"/*; do
        filename=$(basename "$file")
        # Skip the files we already renamed
        if [ "$file" != "$MAIN_JS" ] && [ "$file" != "$MAIN_CSS" ]; then
            cp "$file" "$TARGET_DIR/"
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
echo -e "  - chunk files (*.js directly in version folder)"
