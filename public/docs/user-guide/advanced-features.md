# Advanced Features

Explore powerful features for sophisticated map configurations.

## Categories (Discrete Classification)

Categories classify data into discrete groups with distinct colors and labels.

### Use Cases

- **Land cover types**: Forest, water, urban, agriculture
- **Risk levels**: Low, medium, high, critical
- **Administrative regions**: Countries, states, zones
- **Vegetation classes**: Grassland, shrubland, woodland

### Creating Categories

#### Manual Creation

1. In layer form, select **"Categories"** legend type
2. Click **"Define Categories"**
3. Click **"+ Add Category"**
4. Fill in category details:
   - **Value**: Numeric or string data value
   - **Label**: User-friendly display name
   - **Color**: Category color (hex or picker)
5. Repeat for all categories
6. Click **Save**

#### Copy from Another Layer

1. Click **"Define Categories"**
2. Switch to **"Copy from Layer"** tab
3. Select source layer with categories
4. Click **"Copy Categories"**
5. Edit as needed
6. Click **Save**

### Category Configuration

#### Category Properties

Each category has:

```json
{
  "value": 1,          // Data value to match
  "label": "Forest",   // Display name
  "color": "#228B22"   // Color (hex format)
}
```

#### Value Types

- **Numeric**: `1, 2, 3, 4`
- **String**: `"forest", "water", "urban"`

Ensure values match your data exactly.

#### Color Selection

- Use color picker for visual selection
- Enter hex codes directly (#RRGGBB)
- Consider colorblind-friendly palettes
- Ensure sufficient contrast

### Category Best Practices

**Number of Categories**
- Ideal: 5-10 categories
- Maximum: 15-20 (beyond this, consider grouping)
- Too many categories reduce readability

**Color Schemes**
- Use qualitative color schemes for unordered categories
- Use sequential schemes for ordered categories (low→high)
- Ensure accessibility (contrast, colorblind-safe)

**Label Clarity**
- Use descriptive, unambiguous labels
- Keep labels concise (1-3 words)
- Use consistent terminology

**Order**
- Logical ordering (alphabetical, by value, by importance)
- Place most important/common categories first

### Editing Categories

#### Add New Category
1. Edit layer
2. Click **"Edit Categories"**
3. Click **"+ Add Category"**
4. Fill in details
5. Save

#### Edit Existing Category
1. Edit layer
2. Click **"Edit Categories"**
3. Click on category to edit
4. Modify value, label, or color
5. Save

#### Delete Category
1. Edit layer  
2. Click **"Edit Categories"**
3. Click delete icon on category
4. Confirm deletion
5. Save

#### Reorder Categories
1. Edit layer
2. Click **"Edit Categories"**
3. Drag categories to reorder
4. Save

### Category Preview

The category preview shows how categories will appear:

- **Legend View**: As seen in layer card
- **Map View**: Colors applied to features
- **List View**: All categories with values

Use preview to verify:
- Colors are distinct
- Labels are clear
- Order makes sense

## Colormaps (Continuous Gradients)

Colormaps display continuous data with color gradients.

### Use Cases

- **Temperature**: Blue (cold) → Red (hot)
- **Elevation**: Green (low) → Brown (high) → White (peaks)
- **Vegetation density**: Yellow (sparse) → Green (dense)
- **Data quality**: Red (poor) → Yellow (medium) → Green (good)

### Creating Colormaps

#### Use Preset Colormap

1. In layer form, select **"Colormap"** legend type
2. Click **"Define Colormap"**
3. Select preset from library:
   - **Viridis**: Purple → Yellow (perceptually uniform)
   - **Plasma**: Purple → Pink → Yellow
   - **Inferno**: Black → Red → Yellow
   - **Turbo**: Blue → Green → Yellow → Red
   - **RdYlGn**: Red → Yellow → Green (diverging)
   - **Spectral**: Rainbow spectrum
4. Configure value range:
   - **Min Value**: Data minimum
   - **Max Value**: Data maximum
5. Set **Units** (e.g., "°C", "mm", "index")
6. Add **Label** (e.g., "Temperature")
7. Click **Save**

#### Define Custom Gradient

1. Select **"Custom Gradient"** tab
2. Set **Start Color** (low value)
3. Set **End Color** (high value)
4. Configure min/max values
5. Set units and label
6. Preview gradient
7. Click **Save**

#### Copy from Another Layer

1. Switch to **"Copy from Layer"** tab
2. Select source layer with colormap
3. Click **"Copy Colormap"**
4. Adjust min/max as needed
5. Click **Save**

### Colormap Configuration

#### Colormap Properties

```json
{
  "min": 0,
  "max": 100,
  "colormap": "viridis",
  "units": "%",
  "label": "Vegetation Cover"
}
```

Or for custom gradients:

```json
{
  "min": -10,
  "max": 40,
  "startColor": "#0000FF",
  "endColor": "#FF0000",
  "units": "°C",
  "label": "Temperature"
}
```

### Colormap Types

#### Sequential
- Single hue progression (light → dark)
- Best for: Ordered data with one direction
- Examples: Population density, rainfall

#### Diverging  
- Two hues meeting at midpoint
- Best for: Data with meaningful center (e.g., 0)
- Examples: Temperature anomaly, change detection

#### Perceptually Uniform
- Equal visual steps = equal data steps
- Best for: Accurate data reading
- Recommended: Viridis, Plasma, Inferno

### Value Range Configuration

#### Setting Min/Max

**From Data Metadata**:
1. For COG layers, use **"Fetch Metadata"**
2. System suggests min/max from data
3. Adjust if needed

**Manual Setting**:
1. Determine actual data range
2. Set min/max to cover full range
3. Consider outliers (may need clipping)

**Dynamic Range**:
- Some formats support dynamic range
- Viewer calculates min/max from visible data
- Useful for varying data ranges

### Colormap Best Practices

**Color Selection**
- Use perceptually uniform colormaps for scientific data
- Avoid rainbow (misleading perception)
- Consider colorblind accessibility
- Match colors to data meaning (blue=water, green=vegetation)

**Value Range**
- Set range to actual data extent
- Don't artificially limit range
- Consider data distribution (linear vs log scale)

**Units and Labels**
- Always include units for clarity
- Use standard units (SI preferred)
- Clear labels (e.g., "Mean Annual Temperature" not just "Temperature")

**Reversing Colormaps**
- Some presets can be reversed
- Useful for inverted meanings (e.g., risk = high is red)

## Temporal Configuration

Enable time controls for datasets with temporal dimensions.

### When to Use Temporal Layers

- **Time series data**: Multiple timestamps
- **Forecasts**: Future predictions
- **Historical analysis**: Past observations
- **Animations**: Showing change over time

### Configuring Temporal Layers

#### Step 1: Enable Time Dimension

1. Edit layer
2. Find **"Time Dimension"** section
3. Toggle **"Enable Time"**

#### Step 2: Define Timestamps

**Method 1: Manual Entry**
1. Click **"Manage Timestamps"**
2. Enter dates one per line:
   ```
   2020-01-01
   2020-02-01
   2020-03-01
   ```
3. Click **Save**

**Method 2: Import from File**
1. Click **"Import Timestamps"**
2. Upload CSV or JSON file
3. Map columns/fields to dates
4. Import

**Method 3: Generate Sequence**
1. Click **"Generate Sequence"**
2. Set start date, end date, interval
3. Generate timestamps

#### Step 3: Configure Time URL

Use `{time}` placeholder in data URL:

```
https://data.example.com/layers/{time}/temperature.tif
```

The viewer replaces `{time}` with selected timestamp.

#### Step 4: Set Display Options

- **Default Time**: Initial timestamp to show
- **Time Format**: How dates display to users
  - `YYYY-MM-DD`: 2024-10-17
  - `DD/MM/YYYY`: 17/10/2024
  - `MMMM YYYY`: October 2024
  - Custom formats supported

#### Step 5: Add Time Controls

In layer card configuration:
1. Enable **"Show Time Controls"**
2. Time slider appears in layer card
3. Users can navigate through time

### Temporal URL Patterns

#### Single Placeholder

```
https://example.com/data/{time}/layer.tif
```

Replace entire timestamp.

#### Multiple Placeholders

```
https://example.com/{YYYY}/{MM}/{DD}/data.tif
```

Replace year, month, day separately (requires configuration).

#### Query Parameter

```
https://wms.example.com/service?TIME={time}&LAYERS=temp
```

For WMS/WMTS time dimension.

### Time Format Strings

| Format | Example | Use Case |
|--------|---------|----------|
| `YYYY-MM-DD` | 2024-10-17 | Standard dates |
| `YYYY-MM-DD HH:mm` | 2024-10-17 14:30 | Datetime |
| `DD/MM/YYYY` | 17/10/2024 | European format |
| `MM/DD/YYYY` | 10/17/2024 | US format |
| `MMMM YYYY` | October 2024 | Monthly data |
| `YYYY` | 2024 | Annual data |
| `Qo YYYY` | 4th 2024 | Quarterly |

### Timestamp Management

#### Sorting Timestamps

Timestamps are automatically sorted chronologically.

#### Validating Timestamps

System validates:
- ISO 8601 format compliance
- Chronological ordering
- URL template compatibility

#### Editing Timestamps

1. Click **"Manage Timestamps"**
2. Edit list directly
3. Add/remove dates
4. Save changes

### Temporal Layer Best Practices

**Timestamp Frequency**
- Daily: Weather, air quality
- Weekly: Vegetation indices
- Monthly: Climate averages  
- Annual: Land cover, population

**Time Range**
- Include full available period
- Note data gaps in description
- Consider user needs (recent vs historical)

**Performance**
- Limit timestamp count for performance (<100 ideal)
- Use aggregated timestamps for long series
- Consider on-demand loading for large datasets

**User Experience**
- Set meaningful default time (most recent, or key date)
- Clear time format for user understanding
- Document time zone if relevant

## Swipe Layers (Comparison)

Swipe layers enable side-by-side comparison of datasets.

### Use Cases

- **Before/After**: Land cover change, disaster impact
- **Data Comparison**: Different sensors, models, or processing
- **Temporal Analysis**: Same location, different times
- **Scenario Comparison**: Alternative futures, model runs

### Creating Swipe Layers

#### Step 1: Create Component Layers

First, create the regular layers you want to compare:

1. Create **Layer A** (e.g., "Land Cover 2010")
2. Create **Layer B** (e.g., "Land Cover 2020")
3. Ensure both have proper configuration and attribution

#### Step 2: Create Swipe Layer

1. Click **"+ Add Layer"**
2. Select **"Swipe Layer"**
3. Enter swipe layer name (e.g., "Land Cover Change")
4. Add description explaining the comparison
5. Click **Save** (creates empty swipe configuration)

#### Step 3: Configure Swipe Sources

**Set Clipped Source** (left side):
1. Click **"Set Clipped Source"**
2. Select layer for left side of swipe
3. Save

**Set Base Source(s)** (right side):
1. Click **"Add Base Source"**  
2. Select layer for right side of swipe
3. Can add multiple bases (user switches between them)
4. Save

### Swipe Configuration

A swipe layer references existing layers:

```json
{
  "meta": {
    "swipeConfig": {
      "clippedSourceName": "land_cover_2010",
      "baseSourceNames": ["land_cover_2020"]
    }
  }
}
```

### Swipe Layer Behavior

**In the Viewer**:
- Vertical swipe line divides the map
- Left side: Clipped source
- Right side: Base source(s)
- User drags swipe line to compare
- If multiple bases: User switches between them

**Layer Independence**:
- Swipe layer doesn't duplicate data
- It references existing layers
- Modify source layers → swipe updates automatically

### Multiple Base Sources

Add multiple base sources for complex comparisons:

1. **Clipped**: Original data (2010)
2. **Base 1**: New data (2020)
3. **Base 2**: Predicted data (2030)
4. **Base 3**: Alternative scenario

Users switch between bases while keeping clipped source constant.

### Swipe Layer Best Practices

**Layer Selection**
- Use layers with same extent/projection
- Ensure comparable data types
- Match resolution when possible

**Naming**
- Clear comparison description
- Example: "Forest Change: 2000 vs 2020"
- Note which side is which in description

**Attribution**
- Swipe layer should credit both sources
- Or rely on component layer attribution

**Quality Assurance**
- Swipe layer must have both clipped and base sources
- Incomplete swipe = QA warning

## Layer Statistics

Add downloadable statistics or on-demand data.

### Use Cases

- **Large datasets**: Don't load full data initially
- **Detailed analysis**: Provide extended data on request
- **Downloads**: Offer data files to users
- **Related data**: Link to complementary datasets

### Configuring Statistics

1. Edit layer
2. Enable **"Has Statistics"**
3. Configure statistics source:
   - **URL**: Statistics file or API endpoint
   - **Format**: JSON, CSV, GeoJSON, etc.
   - **Description**: What statistics contain
4. Save

### Statistics Display

In the viewer:
- Layer card shows statistics icon
- Click to load statistics
- Statistics appear in info panel or download dialog
- Statistics load on-demand (performance optimization)

## Advanced Service Configuration

### WMS Time Dimensions

For WMS services with time:

1. Create WMS service
2. Configure GetCapabilities URL
3. System detects time dimension
4. Configure time format and available times
5. Use in temporal layers

### WMTS Matrix Sets

For WMTS services:

1. Configure WMTS service
2. Specify matrix set (e.g., "GoogleMapsCompatible")
3. Define tile ranges
4. Configure tile URL template

### Custom XYZ Templates

For tile services:

1. Create XYZ service
2. Enter URL template: `https://example.com/{z}/{x}/{y}.png`
3. Configure min/max zoom
4. Set tile size (usually 256 or 512)

## Custom Attribution

### Layer-Specific Attribution

Override global attribution for individual layers:

1. Edit layer
2. Find **"Attribution"** section
3. Enter custom attribution text
4. Add attribution URL (optional)
5. Save

Layer attribution takes precedence over global attribution.

### Multiple Attributions

For layers with multiple data sources:

1. Combine attributions in text:
   ```
   © ESA 2024 | © Copernicus Programme | © University XYZ
   ```
2. Link to comprehensive attribution page
3. Detail attributions in layer description

## Keyboard Shortcuts

Speed up your workflow with keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save current layer |
| `Ctrl + E` | Export configuration |
| `Ctrl + Shift + H` | Open documentation |
| `Escape` | Close dialogs |
| `Ctrl + Z` | Undo (in JSON editor) |
| `Ctrl + F` | Find in JSON |

---

[← Previous: Organizing Content](./organizing-content.md) | [Next: Preview & Export →](./preview-export.md)
