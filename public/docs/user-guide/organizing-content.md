# Organizing Content

Learn how to structure and organize your layers for optimal user experience.

## Interface Groups

Interface groups organize layers into collapsible categories in the viewer.

### Why Use Interface Groups?

- **Logical Organization**: Group related layers together
- **Improved Navigation**: Users find layers faster
- **Cleaner Interface**: Reduce visual clutter
- **Workflow Support**: Match user mental models

### Creating Interface Groups

#### Method 1: From Layers Tab Header

1. Go to **Layers** tab
2. Click **"Manage Groups"** button
3. Click **"+ Add Group"**
4. Enter **Group Label** (e.g., "Land Cover Layers")
5. Click **Create**

#### Method 2: When Adding a Layer

1. In the layer form, find **"Interface Group"** section
2. Click **"+ Create New Group"**
3. Enter group label
4. Layer is automatically assigned to the new group

### Managing Interface Groups

#### Rename Group
1. Click **"Manage Groups"**
2. Click edit icon on group
3. Enter new label
4. Save

#### Delete Group
1. Click **"Manage Groups"**
2. Click delete icon
3. Confirm deletion
4. Layers in group become ungrouped

**Note**: Deleting a group does not delete layers, only the grouping.

### Assigning Layers to Groups

#### During Layer Creation
- Select group from **"Interface Group"** dropdown
- Or create new group inline

#### For Existing Layers
1. Click **Edit** on layer card
2. Change **"Interface Group"** selection
3. Save layer

#### Moving Multiple Layers
Use the Draw Order tab for batch operations (see below).

### Group Best Practices

**Naming Conventions**
- Use clear, descriptive names
- Keep names concise (2-4 words)
- Use consistent terminology

**Organization Strategies**

1. **By Theme**: "Vegetation", "Climate", "Infrastructure"
2. **By Source**: "Copernicus Data", "ESA Products"
3. **By Time Period**: "Historical (2000-2010)", "Recent (2020-2024)"
4. **By Region**: "Northern Europe", "Mediterranean"
5. **By Data Type**: "Optical Imagery", "Radar Data"

**Group Size**
- Ideal: 3-7 layers per group
- Maximum: 10-12 layers
- Create sub-groups for larger collections

**Default State**
- Important groups: Expanded by default
- Advanced groups: Collapsed by default
- Configure in group settings

## Layer Hierarchy

### Understanding Layer Order

Layers have two types of order:

1. **Visual Order (Draw Order)**: Which layers appear on top in the map
2. **UI Order**: How layers are listed in the interface

### Visual Order (Draw Order)

Controls layer stacking on the map.

#### Key Concepts
- Higher position = Drawn on top
- Lower position = Drawn underneath
- Only affects overlapping layers

#### Managing Draw Order

**In Draw Order Tab:**
1. Go to **Draw Order** tab
2. See numbered list of all layers
3. Drag layers to reorder
4. Changes save automatically

**Quick Reorder:**
- **Move to Top**: Places layer at position 1
- **Move to Bottom**: Places layer last
- **Move Up/Down**: Adjusts position by 1

**Batch Operations:**
- Select multiple layers
- Click **"Move Selected"**
- Choose target position

### UI Order

Controls how layers are listed in groups.

#### Layer Card Position

Within a group, layers are ordered by:
1. Manual position (if set)
2. Creation order (default)

#### Reordering in UI

**Drag and Drop** (in Layers tab):
1. Hover over layer card
2. Click and hold drag handle
3. Drag to new position
4. Release to drop

**Using Layer Controls**:
1. Click **⋮** menu on layer card
2. Select **Move Up** or **Move Down**
3. Repeat as needed

## Exclusivity Sets

Exclusivity sets ensure only one layer from a set can be active at a time.

### When to Use Exclusivity Sets

- **Alternative datasets**: Different data for same phenomenon
- **Seasonal views**: Spring, Summer, Fall, Winter
- **Resolution levels**: High-res, Medium-res, Low-res
- **Model outputs**: Different model runs or scenarios

### Creating Exclusivity Sets

#### Method 1: In Settings Tab

1. Go to **Settings** tab
2. Find **"Exclusivity Sets"** section
3. Click **"+ Add Set"**
4. Enter **Set Name** (e.g., "Seasonal Views")
5. Click **Create**

#### Method 2: In Layer Form

1. Edit a layer
2. Find **"Exclusivity Set"** section
3. Select existing set or create new
4. Save layer

### Assigning Layers to Sets

1. Edit layer
2. Select **Exclusivity Set** from dropdown
3. Save
4. Repeat for all layers in the set

### Managing Exclusivity Sets

#### View Assignments
- Go to Draw Order tab
- Sets are shown in "Exclusivity Set" column

#### Remove Layer from Set
1. Edit layer
2. Set exclusivity to **"None"**
3. Save

#### Delete Set
1. Go to Settings tab
2. Find exclusivity set
3. Click delete
4. Confirm (layers remain, but lose exclusivity)

### Exclusivity Best Practices

- **Clear naming**: "Land Cover Years", "Data Providers"
- **Complete sets**: Include all related layers
- **User communication**: Explain in layer descriptions
- **Default layer**: One layer should be default visible

## Ungrouped Layers

Layers without an interface group appear in "Ungrouped Layers".

### When to Leave Layers Ungrouped

- **Standalone important layers**: Key datasets
- **Temporary layers**: Work in progress
- **Overlays**: Universal layers like borders, labels

### Managing Ungrouped Layers

View all ungrouped layers:
1. Go to **Layers** tab
2. Find **"Ungrouped Layers"** section
3. See all layers without groups

Organize ungrouped layers:
1. Select multiple ungrouped layers
2. Click **"Assign to Group"**
3. Choose or create group
4. Apply

## Recommended Organization Patterns

### Pattern 1: Simple Thematic

```
📁 Base Layers (group)
├── Street Map
├── Satellite Imagery
└── Terrain

📁 Land Cover (group)
├── Land Cover 2020
├── Land Cover 2015
└── Land Cover 2010

📁 Climate Data (group)
├── Temperature
├── Precipitation
└── Wind Speed
```

### Pattern 2: Source-Based

```
📁 Copernicus Products (group)
├── Sentinel-2 Imagery
├── Land Cover
└── Burned Areas

📁 ESA CCI (group)
├── Soil Moisture
├── Sea Surface Temperature
└── Biomass
```

### Pattern 3: Workflow-Based

```
📁 Overview Layers (group)
├── Global Land Cover
└── Major Biomes

📁 Detailed Analysis (group)
├── High-Res Imagery
├── Vegetation Indices
└── Change Detection

📁 Reference Data (group)
├── Administrative Boundaries
└── Protected Areas
```

### Pattern 4: Temporal

```
📁 Historical (2000-2010) (group)
├── Land Cover 2000
└── Land Cover 2010

📁 Recent (2015-2024) (group)
├── Land Cover 2015
├── Land Cover 2020
└── Land Cover 2024
```

## Complex Configuration Example

A complete organization structure:

```
BASE LAYERS (ungrouped)
├── OpenStreetMap (default)
├── Satellite Imagery
└── Terrain Map

📁 Copernicus Land Cover (expanded by default)
├── Land Cover 2020 (default visible, Exclusivity: "LC Years")
├── Land Cover 2015 (Exclusivity: "LC Years")
└── Land Cover 2010 (Exclusivity: "LC Years")

📁 Vegetation Indices (collapsed by default)
├── NDVI Current
├── NDVI Time Series
└── EVI Enhanced

📁 Climate Layers (collapsed by default)
├── Temperature
├── Precipitation
└── Drought Index

📁 Comparison Tools (collapsed by default)
└── Land Cover Change Swipe (Swipe: 2010 vs 2020)

STATISTICS (ungrouped)
└── Download Full Datasets
```

## Organization Checklist

Before finalizing your configuration:

- [ ] All thematic layers grouped logically
- [ ] Base layers clearly identified
- [ ] Group names are clear and concise
- [ ] Important groups expanded by default
- [ ] Exclusivity sets defined where needed
- [ ] Draw order reflects visual priority
- [ ] Related layers are adjacent in UI
- [ ] Temporal layers ordered chronologically
- [ ] No more than 10-12 layers per group
- [ ] Ungrouped layers are intentional

---

[← Previous: Creating Layers](./creating-layers.md) | [Next: Advanced Features →](./advanced-features.md)
