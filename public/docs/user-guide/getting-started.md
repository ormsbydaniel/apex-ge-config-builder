# Getting Started

This guide will walk you through your first steps with the ESA Map Configuration Tool.

## Overview

The ESA Map Configuration Tool is a web-based interface for creating map viewer configurations. It allows you to build complex geospatial applications by:

1. Adding data layers from various sources
2. Configuring how layers appear and behave
3. Organizing layers into groups
4. Previewing the final viewer
5. Exporting the configuration

## Interface Layout

The tool uses a tabbed interface with the following sections:

### Home Tab
- Configuration summary and statistics
- Quick access to recent actions
- Quality assurance overview

### Layers Tab
- Main workspace for creating and editing layers
- Hierarchical view of all layers and groups
- Layer cards showing configuration details

### Draw Order Tab
- Visual ordering of layers
- Control which layers appear on top
- Batch reordering tools

### Services Tab
- Manage reusable service connections
- WMS, WMTS, XYZ configurations
- Service library for quick layer creation

### Settings Tab
- Map metadata (title, description)
- Layout configuration
- Attribution settings

### Preview Tab
- Live preview of your map
- Test layer interactions
- Verify configuration before export

## Your First Configuration

### Step 1: Set Basic Information

1. Go to the **Settings** tab
2. Enter a **Map Title** (e.g., "European Land Cover Map")
3. Add a **Description** (optional)
4. Configure initial map view (center coordinates, zoom level)

### Step 2: Add a Base Layer

1. Go to the **Layers** tab
2. Click **"+ Add Layer"**
3. Select **"Base Layer"** as the type
4. Choose a base map provider:
   - OpenStreetMap (default)
   - Satellite imagery
   - Terrain maps
5. Configure the layer name and visibility
6. Click **Save**

### Step 3: Add Your First Data Layer

1. Click **"+ Add Layer"** again
2. Select **"Regular Layer"**
3. Configure the data source:
   - **Service**: Select or create a WMS/WMTS service
   - **Layer Name**: The layer identifier from the service
   - **Display Name**: How it appears to users
4. Add attribution information
5. Click **Save**

### Step 4: Preview Your Map

1. Go to the **Preview** tab
2. Your map will load with the configured layers
3. Test layer toggles and interactions
4. Use the back button to return and make adjustments

### Step 5: Export Configuration

1. Return to the **Home** tab
2. Review the configuration summary
3. Click **"Export"** in the top navigation
4. Choose export format:
   - **Download JSON**: Save to your computer
   - **Copy to Clipboard**: Paste elsewhere
5. Deploy the configuration to your viewer

## Next Steps

Now that you have a basic configuration:

- Learn about [Core Concepts](./core-concepts.md) to understand the data model
- Explore [Creating Layers](./creating-layers.md) for detailed layer configuration
- Read about [Organizing Content](./organizing-content.md) to structure your layers
- Discover [Advanced Features](./advanced-features.md) like categories and time controls

## Tips for Success

- **Start simple**: Create a basic configuration before adding complexity
- **Use services**: Define reusable services for layers from the same source
- **Organize early**: Group related layers from the start
- **Preview often**: Test your configuration regularly
- **Check QA**: Monitor quality indicators on layer cards
- **Save configurations**: Export and backup your work regularly

---

[← Back to Index](./index.md) | [Next: Core Concepts →](./core-concepts.md)
