# Core Concepts

Understanding these fundamental concepts will help you work effectively with the configuration tool.

## Configuration Structure

A map configuration consists of several key components:

```
Configuration
├── Meta (Metadata)
│   ├── Title
│   ├── Description
│   └── Attribution
├── Layout
│   ├── Initial View (center, zoom)
│   ├── Interface Groups
│   └── Layer Cards
└── Sources (Data Layers)
    ├── Base Layers
    ├── Regular Layers
    ├── Swipe Layers
    └── Statistics Layers
```

## Data Sources (Layers)

Data sources are the core building blocks of your map configuration.

### Layer Properties

Every layer has:

- **Unique ID**: Internal identifier (auto-generated)
- **Name**: Display name shown to users
- **Type**: Base, Regular, Swipe, or Statistics
- **Data**: URLs and service configuration
- **Meta**: Additional information (attribution, categories, etc.)
- **Layout**: Visual configuration (cards, legends, controls)

### Layer Types

#### Base Layers
- Background maps (streets, satellite, terrain)
- Only one visible at a time
- User can switch between them
- Do not count toward QA statistics

#### Regular Layers
- Standard thematic data layers
- Can be toggled on/off
- Support legends, categories, time controls
- Most common layer type

#### Swipe Layers
- Compare two datasets side-by-side
- Interactive swipe control
- Requires a "clipped" source and one or more "base" sources
- Useful for before/after comparisons

#### Statistics Layers
- Companion layers for data analysis
- Linked to regular layers
- Load on demand for performance

## Interface Groups

Interface groups organize layers into logical categories.

### Purpose
- Group related layers together
- Create collapsible sections in the viewer
- Improve navigation in complex configurations

### Properties
- **Group ID**: Unique identifier
- **Label**: Display name
- **Collapsed by Default**: Initial state (true/false)

### Best Practices
- Use groups for thematic organization (e.g., "Land Cover", "Climate Data")
- Keep 3-7 layers per group for usability
- Order groups by importance or workflow

## Data Sources vs Services

Understanding the difference:

### Data Sources
- Individual layers in your map
- Can be standalone or use a service
- Include all layer-specific configuration

### Services
- Reusable connection configurations
- Define how to connect to WMS, WMTS, XYZ servers
- One service can support multiple layers

**Example**: A WMS service for "Copernicus Data" can provide 10 different layers.

## Attribution

Attribution gives credit to data providers.

### Levels
1. **Global Attribution**: Default for all layers (Settings tab)
2. **Layer Attribution**: Specific to individual layers
3. **Priority**: Layer attribution overrides global attribution

### Components
- **Text**: Credit text (e.g., "© ESA 2024")
- **URL**: Link to provider (optional)

## Layout Configuration

### Layer Cards
Control how layer information appears:

- **Legend**: Visual color/symbol guide
- **Description**: Layer explanation
- **Download Links**: Data access
- **Time Controls**: Temporal navigation

### Info Panel
Extended layer information:

- Detailed descriptions
- Additional legends
- Data documentation

## Categories and Colormaps

### Categories
Discrete value classifications:

```
Categories: Land Cover Types
- Forest (green)
- Water (blue)
- Urban (red)
```

### Colormaps
Continuous value gradients:

```
Colormap: Temperature
- Low: Blue
- Mid: Yellow  
- High: Red
```

## Temporal Data

Time-enabled layers support:

- **Time Dimension**: Available dates/times
- **Time Controls**: User navigation
- **Default Time**: Initial timestamp
- **Time Format**: Display format

## Quality Assurance

Built-in validation helps ensure configuration quality:

- **Red (Error)**: Missing critical data
- **Amber (Warning)**: Missing attribution or incomplete swipe config
- **Blue (Info)**: Missing legend
- **Green (Success)**: All checks passed

## Data Formats

Supported formats:

- **COG** (Cloud Optimized GeoTIFF): Raster imagery
- **FlatGeobuf**: Vector features
- **WMS**: Web Map Service
- **WMTS**: Web Map Tile Service
- **XYZ**: Tiled images

## Export Formats

The configuration can be exported as:

- **JSON**: Complete configuration file
- **Minified**: Optimized for production
- **Pretty**: Human-readable for editing

## Vocabulary

| Term | Definition |
|------|------------|
| **Source** | A data layer in the configuration |
| **Service** | Reusable connection to a data server |
| **Interface Group** | Collection of related layers |
| **Base Layer** | Background map layer |
| **Swipe Layer** | Interactive comparison layer |
| **Category** | Discrete data classification |
| **Colormap** | Continuous color gradient |
| **Attribution** | Data provider credit |
| **Temporal** | Time-enabled data |
| **COG** | Cloud Optimized GeoTIFF |

---

[← Previous: Getting Started](./getting-started.md) | [Next: Creating Layers →](./creating-layers.md)
