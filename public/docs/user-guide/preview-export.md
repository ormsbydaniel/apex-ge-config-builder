# Preview & Export

Learn how to preview your configuration and export it for deployment.

## Preview Tab

The Preview tab provides a live view of your map configuration in the actual viewer.

### Accessing Preview

**Method 1: Preview Tab**
1. Click **"Preview"** tab in main navigation
2. Viewer loads with your current configuration

**Method 2: Preview Route**
1. Click **"Open Preview"** in top navigation
2. Opens in full window view at `/preview` route
3. Navigate back to return to config builder

### Preview Features

The preview includes:

- ✅ **Full Viewer**: Actual viewer with all features
- ✅ **Live Configuration**: Current unsaved changes included
- ✅ **All Layers**: Base layers, regular layers, swipe layers
- ✅ **Interactive Controls**: Layer toggles, time controls, swipe
- ✅ **Complete UI**: Layer cards, legends, info panels

### Testing in Preview

#### Test Layer Visibility
1. Go to Preview
2. Toggle layers on/off
3. Verify correct visibility behavior
4. Check exclusivity sets work correctly

#### Test Legends
1. Enable layers with legends
2. Verify legend appears in layer card
3. Check category colors match data
4. Verify colormap displays correctly

#### Test Time Controls
1. Enable temporal layer
2. Use time slider
3. Verify data updates for each timestamp
4. Check time format displays correctly

#### Test Swipe Layers
1. Enable swipe layer
2. Drag swipe line left and right
3. Verify clipped source on left
4. Verify base source on right
5. Switch between multiple bases if configured

#### Test Attribution
1. Check attribution appears
2. Verify attribution links work
3. Ensure correct attribution for each layer

#### Test Layer Cards
1. Expand layer cards
2. Verify all configured elements appear:
   - Description
   - Legend
   - Download links
   - Time controls
   - Info button

### Preview Limitations

**Editor Features Not in Viewer**:
- No layer editing
- No configuration changes
- Read-only layer information

**Performance**:
- Large configurations may load slowly
- Preview uses actual data URLs
- Network speed affects loading

### Preview Workflow

Recommended preview workflow:

1. **Initial Preview**: After adding first layer
2. **Feature Preview**: After configuring legends, categories, colormaps
3. **Interaction Preview**: After setting up time controls, swipe
4. **Organization Preview**: After grouping and ordering layers
5. **Final Preview**: Before exporting configuration

### Returning from Preview

**From Preview Tab**:
- Click any other tab to return to editing

**From Preview Route** (`/preview`):
- Click **"Back to Editor"** button
- Or use browser back button
- Returns to your previous tab

**State Preservation**:
- Your editing state is preserved
- Expanded groups remain expanded
- Active tab is restored
- Scroll position is maintained

## Exporting Configuration

Export your configuration for deployment to the viewer.

### Export Options

Click **"Export"** in top navigation to see options:

#### 1. Download JSON File
- Saves configuration as JSON file
- File name: `config.json`
- Ready for deployment

#### 2. Copy to Clipboard
- Copies JSON to clipboard
- Paste into your deployment system
- Useful for quick sharing

#### 3. Minified vs Pretty
- **Minified**: Compact, optimized for production
- **Pretty**: Human-readable, useful for editing

### Export Process

1. Click **"Export"** in top navigation
2. Review export summary:
   - Layer count
   - Group count
   - QA status
3. Choose export format (minified/pretty)
4. Select export method:
   - Download file
   - Copy to clipboard
5. Click **"Export"**

### Export Validation

Before export, system checks:

- ✅ **Valid JSON**: Configuration structure is valid
- ✅ **Required Fields**: All mandatory fields present
- ✅ **Layer References**: Swipe layers reference existing layers
- ⚠️ **QA Issues**: Warnings for incomplete layers (doesn't block export)

**Export is allowed** even with QA warnings, but:
- Review warnings before production deployment
- Fix critical issues (missing data URLs)
- Address warnings when possible (attribution, legends)

### Exported Configuration Structure

The exported JSON contains:

```json
{
  "meta": {
    "title": "Map Title",
    "description": "Map description",
    "attribution": {
      "text": "© Provider",
      "url": "https://..."
    }
  },
  "layout": {
    "initialView": {
      "center": [lat, lon],
      "zoom": 5
    },
    "interfaceGroups": [...],
    "layerCards": {...}
  },
  "sources": [
    {
      "id": "layer_1",
      "name": "Layer Name",
      "data": [...],
      "meta": {...},
      "layout": {...}
    }
  ]
}
```

### Export Transformations

The export process applies transformations:

#### 1. Format Normalization
- Converts internal format to viewer format
- Maps layer types to viewer expectations
- Standardizes URLs and references

#### 2. Data Cleanup
- Removes editor-only fields
- Strips temporary IDs
- Optimizes structure

#### 3. Reference Resolution
- Resolves swipe layer references
- Links statistics to main layers
- Connects services to layers

#### 4. Validation
- Ensures schema compliance
- Validates required fields
- Checks data consistency

## Deploying Configuration

After export, deploy to your viewer.

### Deployment Methods

#### Method 1: Direct File Replacement

1. Export configuration as `config.json`
2. Replace existing `config.json` in viewer deployment
3. Refresh viewer to load new configuration

#### Method 2: Configuration URL

Some viewer deployments support URL parameter:

```
https://viewer.example.com/?config=https://configs.example.com/my-config.json
```

1. Export and host configuration file
2. Pass URL to viewer
3. Viewer fetches and loads configuration

#### Method 3: Embedded Configuration

For embedded viewers:

1. Export configuration
2. Pass as JavaScript object to viewer initialization
3. Viewer uses provided configuration

### Post-Deployment Validation

After deploying:

1. **Load Viewer**: Open deployed viewer
2. **Test All Layers**: Verify each layer loads
3. **Test Interactions**: Time controls, swipe, toggles
4. **Verify Data**: Check data displays correctly
5. **Test Performance**: Monitor loading times
6. **Check Attribution**: Ensure attribution appears

### Configuration Versioning

Best practices for version management:

#### File Naming
```
config-v1.0.0.json
config-2024-10-17.json
config-production.json
config-staging.json
```

#### Version Control
- Store configurations in version control (Git)
- Tag releases
- Maintain changelog
- Keep backup of working configurations

#### Deployment Environments
- **Development**: Testing new features
- **Staging**: Pre-production validation
- **Production**: Live deployment

## Configuration Management

### Saving Configurations

**Auto-Save**:
- Configuration automatically saved in browser
- Persists across sessions
- Uses browser localStorage

**Manual Export**:
- Export to file regularly
- Keep backups of major versions
- Document significant changes

### Loading Configurations

**Method 1: Import JSON**
1. Click **"Import"** in top navigation
2. Select JSON file
3. Configuration loads and replaces current

**Method 2: Paste JSON**
1. Go to **Settings** tab → **Advanced** section
2. Click **"Load from JSON"**
3. Paste JSON configuration
4. Click **Load**

### Backing Up Configurations

Recommended backup strategy:

1. **Before Major Changes**: Export current config
2. **After Completing Features**: Export milestone versions
3. **Before Deployment**: Export pre-production config
4. **Regular Intervals**: Export weekly/monthly backups

Store backups:
- Local file system
- Version control (Git)
- Cloud storage
- Team shared drive

## Validation Errors

Understanding and fixing validation errors.

### Common Validation Errors

#### Missing Required Field

**Error**: `Layer "X" missing required field "name"`

**Fix**:
1. Edit the layer
2. Fill in missing field
3. Save

#### Invalid URL

**Error**: `Layer "X" has invalid data URL`

**Fix**:
1. Check URL format
2. Ensure URL is accessible
3. Verify protocol (http/https)
4. Update and save

#### Invalid Reference

**Error**: `Swipe layer "X" references non-existent layer "Y"`

**Fix**:
1. Edit swipe layer
2. Select valid clipped/base sources
3. Or create the missing layer
4. Save

#### Format Mismatch

**Error**: `Layer format "COG" doesn't match content type`

**Fix**:
1. Verify actual file format
2. Update format selection
3. Or update URL to correct file
4. Save

### Validation Warnings

Warnings don't prevent export but indicate quality issues:

#### Missing Attribution

**Warning**: `Layer "X" missing attribution`

**Impact**: QA status = Amber

**Fix**:
1. Edit layer
2. Add attribution text
3. Optionally add URL
4. Save

#### Missing Legend

**Warning**: `Layer "X" missing legend`

**Impact**: QA status = Blue

**Fix**:
1. Edit layer
2. Configure appropriate legend type
3. Define categories or colormap
4. Save

#### Incomplete Swipe

**Warning**: `Swipe layer "X" missing base source`

**Impact**: QA status = Amber

**Fix**:
1. Edit swipe layer
2. Configure missing source
3. Save

## Advanced Export Options

### Selective Export

Export specific parts of configuration:

#### Export Single Layer
1. Right-click layer card
2. Select **"Export Layer"**
3. Saves layer JSON
4. Use for sharing or templates

#### Export Interface Group
1. Right-click group header
2. Select **"Export Group"**
3. Exports group and all layers
4. Use for configuration modules

### Configuration Templates

Create reusable templates:

1. Build configuration with desired structure
2. Export as template
3. Remove specific data (keep structure)
4. Save as template file
5. Import and populate for new projects

### Batch Operations Before Export

Optimize configuration before export:

1. **Batch Update Attribution**:
   - Select multiple layers
   - Apply common attribution
   - Faster than individual edits

2. **Batch Organize**:
   - Assign multiple layers to groups
   - Set exclusivity for layer sets
   - Reorder draw order

3. **Validate All**:
   - Review QA summary
   - Fix critical issues
   - Address warnings

## Troubleshooting Export Issues

### Export Fails

**Issue**: Export button doesn't work

**Possible Causes**:
- Browser memory limit reached
- Invalid JSON structure
- Missing required fields

**Solutions**:
1. Check browser console for errors
2. Validate configuration in JSON editor
3. Try exporting smaller sections
4. Refresh browser and retry

### Large Configuration Export

**Issue**: Very large configurations slow to export

**Solutions**:
1. Use minified format
2. Export in sections
3. Optimize layer count
4. Remove unused layers/groups

### Invalid JSON Error

**Issue**: "Invalid JSON" error on export

**Solutions**:
1. Go to Settings → Advanced → JSON Editor
2. Use "Validate" button
3. Fix highlighted errors
4. Re-export

## Deployment Checklist

Before deploying to production:

- [ ] All layers tested in Preview
- [ ] QA status reviewed and critical issues resolved
- [ ] Attribution complete for all layers
- [ ] Layer order and grouping finalized
- [ ] Time controls tested for temporal layers
- [ ] Swipe layers configured and tested
- [ ] Configuration exported and backed up
- [ ] Validation passed with no errors
- [ ] Warnings addressed or documented
- [ ] Viewer deployment tested
- [ ] Performance verified
- [ ] User acceptance testing completed

---

[← Previous: Advanced Features](./advanced-features.md) | [Next: Quality Assurance →](./quality-assurance.md)
