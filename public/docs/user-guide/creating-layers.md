# Creating Layers

This guide covers all aspects of creating and configuring data layers.

## Layer Creation Workflow

1. **Choose Layer Type** → 2. **Configure Data Source** → 3. **Add Metadata** → 4. **Configure Display** → 5. **Save**

## Base Layers

Base layers provide the background map context.

### Creating a Base Layer

1. Click **"+ Add Layer"** in the Layers tab
2. Select **"Base Layer"**
3. Choose a base map provider or configure custom:
   - **Preset Options**: OpenStreetMap, Satellite, Terrain
   - **Custom XYZ**: Enter tile URL template
4. Configure properties:
   - **Name**: Display name (e.g., "Street Map")
   - **Default**: Set as default base layer
   - **Visibility**: Initially visible
5. Click **Save**

### Base Layer Best Practices

- Provide 2-3 base layer options (street, satellite, terrain)
- Set the most appropriate as default
- Use high-quality tile services
- Ensure proper attribution

## Regular Layers

Regular layers display thematic geospatial data.

### Step 1: Basic Information

1. Click **"+ Add Layer"**
2. Select **"Regular Layer"**
3. Enter **Layer Name**: User-facing display name
4. Add **Description** (optional): Explains the layer's content

### Step 2: Configure Data Source

Choose your data source type:

#### Option A: Use Existing Service

1. Select **"Use Existing Service"**
2. Choose from service library
3. Enter **Layer Name** (service-specific identifier)
4. The service URL and configuration are inherited

#### Option B: Direct URL

1. Select **"Direct URL"**
2. Choose **Format**:
   - **COG**: Cloud Optimized GeoTIFF
   - **FlatGeobuf**: Vector data
   - **WMS**: Web Map Service
   - **WMTS**: Web Map Tile Service
   - **XYZ**: Tile service
3. Enter the **Data URL**
4. Configure format-specific options

#### Option C: S3 Layer (COG/FlatGeobuf)

1. Select **"S3 Layer"**
2. Choose **Format**: COG or FlatGeobuf
3. Browse or enter **S3 URL**
4. Configure rendering options

### Step 3: Attribution

Required for quality assurance:

1. Enter **Attribution Text** (e.g., "© ESA Copernicus")
2. Add **Attribution URL** (optional link to provider)

### Step 4: Configure Legend

Choose legend type:

#### No Legend
- Layer has no visual legend
- Suitable for simple overlays

#### Image Legend
- Upload or link to legend image
- Displays in layer card or info panel

#### Categories (Discrete Values)
- Define value-color mappings
- See [Categories Section](#configuring-categories) below

#### Colormap (Continuous Values)
- Define color gradient
- See [Colormaps Section](#configuring-colormaps) below

### Step 5: Layer Card Configuration

Control what appears in the layer card:

- **Show Description**: Display layer description
- **Show Legend**: Display legend in card
- **Show Download Link**: Provide data download
- **Show Info Button**: Link to detailed info panel

### Step 6: Additional Options

- **Interface Group**: Assign to a group
- **Exclusivity Set**: Define mutually exclusive layers
- **Opacity**: Default opacity (0-1)
- **Visibility**: Initially visible/hidden

## Configuring Categories

Categories classify discrete values with colors and labels.

### Creating Categories

1. In layer form, select **"Categories"** as legend type
2. Click **"Define Categories"**
3. Choose method:

#### Manual Definition
- Click **"+ Add Category"**
- Enter **Value**: Data value
- Enter **Label**: Display name
- Choose **Color**: Category color
- Repeat for all categories

#### Copy from Another Layer
- Select **Source Layer**
- Click **Copy**
- Edit as needed

### Category Best Practices

- Use clear, descriptive labels
- Choose distinct colors for accessibility
- Order categories logically (e.g., by value or importance)
- Limit to 10-15 categories for readability

### Category Format

Categories are stored as:

```json
{
  "value": 1,
  "label": "Forest",
  "color": "#228B22"
}
```

## Configuring Colormaps

Colormaps define continuous color gradients.

### Creating a Colormap

1. Select **"Colormap"** as legend type
2. Click **"Define Colormap"**
3. Choose method:

#### Use Preset Colormap
- Select from library (Viridis, Plasma, etc.)
- Configure **Min/Max Values**
- Set **Units** (optional)

#### Define Custom Gradient
- Set **Start Color** (low value)
- Set **End Color** (high value)
- Configure **Min/Max Values**
- Set **Units** and **Label**

#### Copy from Another Layer
- Select **Source Layer**
- Click **Copy**
- Adjust as needed

### Colormap Best Practices

- Choose colorblind-friendly palettes
- Use diverging colormaps for data with a meaningful midpoint
- Set appropriate min/max values for your data range
- Include units for clarity

## Temporal Layers

Add time controls to layers with temporal data.

### Configuring Temporal Data

1. In layer form, enable **"Time Dimension"**
2. Configure time settings:
   - **Available Timestamps**: List of ISO dates
   - **Default Time**: Initial timestamp
   - **Time Format**: Display format
3. Add **Time Controls** to layer card

### Time URL Templates

Use `{time}` placeholder in URLs:

```
https://example.com/data/{time}/layer.tif
```

The viewer replaces `{time}` with the selected timestamp.

### Managing Timestamps

Use the **Timestamp Management Dialog**:

- Import from CSV or JSON
- Manual entry (one per line)
- Validate date formats
- Sort chronologically

## COG Layers (Cloud Optimized GeoTIFF)

### Creating COG Layers

1. Select **"Direct URL"** or **"S3 Layer"**
2. Choose **Format**: COG
3. Enter **COG URL**
4. Configure rendering:
   - **Bands**: RGB band indices (e.g., [1,2,3])
   - **Min/Max Values**: Contrast stretch
   - **Colormap**: For single-band data
   - **No Data Value**: Transparent value

### COG Metadata

Extract metadata from COG files:

1. Enter COG URL
2. Click **"Fetch Metadata"**
3. System retrieves:
   - Band count
   - Data type
   - Resolution
   - Bounding box
   - Suggested min/max values

### COG Best Practices

- Use COGs for large raster datasets
- Configure appropriate min/max for visualization
- Use colormaps for single-band scientific data
- Consider file size and tile structure for performance

## FlatGeobuf Layers (Vector Data)

### Creating FlatGeobuf Layers

1. Select **"Direct URL"** or **"S3 Layer"**
2. Choose **Format**: FlatGeobuf
3. Enter **FlatGeobuf URL**
4. Configure styling:
   - **Fill Color**: Polygon fill
   - **Stroke Color**: Line color
   - **Opacity**: Layer opacity

### FlatGeobuf Metadata

Extract metadata from FlatGeobuf files:

1. Enter FlatGeobuf URL
2. Click **"Fetch Metadata"**
3. System retrieves:
   - Feature count
   - Geometry type
   - Bounding box
   - Properties schema

## Swipe Layers

Swipe layers enable side-by-side data comparison.

### Creating a Swipe Layer

1. Click **"+ Add Layer"**
2. Select **"Swipe Layer"**
3. Enter layer name and description
4. Click **Save** to create empty swipe layer
5. Configure swipe sources:

#### Set Clipped Source
- Click **"Set Clipped Source"**
- Select the layer shown on the left side
- This layer will be clipped by the swipe line

#### Set Base Sources
- Click **"Add Base Source"**
- Select layer(s) shown on the right side
- Can add multiple base sources

### Swipe Layer Quality

Swipe layer QA requires:
- ✅ At least one clipped source
- ✅ At least one base source
- Both must reference existing layers

## Statistics Layers

Statistics layers provide on-demand data access without loading all data upfront.

### Creating Statistics Layers

1. Create a regular layer first
2. In layer form, enable **"Has Statistics"**
3. Configure statistics source:
   - **URL**: Statistics data endpoint
   - **Format**: Data format (usually JSON or CSV)
4. Statistics load when user requests them

### Use Cases

- Large datasets that slow initial load
- Detailed analysis data
- Downloadable data files
- Extended information

## Layer Validation

The system validates layers for:

- ✅ **Data URLs**: Valid and accessible
- ✅ **Attribution**: Present and complete
- ✅ **Legend**: Appropriate for data type
- ✅ **Swipe Config**: Both sources defined
- ✅ **Format**: Matches content type

Check quality indicators on layer cards.

## Common Workflows

### Workflow: Add WMS Layer

1. Go to Services tab → Create WMS service
2. Go to Layers tab → Add Regular Layer
3. Select the WMS service
4. Enter layer name from GetCapabilities
5. Add attribution
6. Configure legend if needed
7. Save

### Workflow: Add COG with Colormap

1. Add Regular Layer
2. Choose Direct URL → COG format
3. Enter COG URL → Fetch Metadata
4. Configure colormap legend
5. Set min/max values from metadata
6. Add units and label
7. Save

### Workflow: Create Before/After Swipe

1. Create two regular layers (before and after)
2. Add Swipe Layer
3. Set "before" layer as clipped source
4. Set "after" layer as base source
5. Save and preview

---

[← Previous: Core Concepts](./core-concepts.md) | [Next: Organizing Content →](./organizing-content.md)
