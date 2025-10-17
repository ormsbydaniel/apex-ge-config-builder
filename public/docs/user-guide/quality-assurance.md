# Quality Assurance

Comprehensive guide to the QA tools in the ESA Map Configuration Tool.

## Overview

The tool provides two complementary QA systems:

1. **Layer QA Status** - Quality indicators on individual layer cards
2. **Data Source Validation** - Comprehensive validation reporting

## Layer QA Status

### What is Layer QA?

Each layer card displays a colored QA status icon indicating the layer's quality and completeness.

### QA Status Levels

#### 🔴 Red - Error (Critical Issues)

**Meaning**: Layer is missing essential data

**Criteria**:
- No data URLs configured
- No statistics URLs configured
- Layer has no content to display

**Impact**:
- Layer cannot function in viewer
- Must be fixed before production deployment

**Fix**:
1. Edit layer
2. Add data source URL(s)
3. Or add statistics URL
4. Save layer

#### 🟡 Amber - Warning

**Meaning**: Layer is functional but missing recommended elements

**Criteria**:
- Missing attribution
- Incomplete swipe configuration (missing clipped or base source)

**Impact**:
- Layer works but lacks proper credit
- Swipe layer cannot function
- May violate data licensing requirements

**Fix Attribution**:
1. Edit layer
2. Add attribution text
3. Optionally add attribution URL
4. Save

**Fix Swipe**:
1. Edit swipe layer
2. Set clipped source
3. Add at least one base source
4. Save

#### 🔵 Blue - Info

**Meaning**: Layer is functional but could be enhanced

**Criteria**:
- Layer has data but no legend configured
- Only counted if layer has actual content

**Impact**:
- Users cannot interpret data values
- Reduces layer usability

**Fix**:
1. Edit layer
2. Choose legend type:
   - Image legend
   - Categories (discrete values)
   - Colormap (continuous values)
3. Configure legend
4. Save

#### 🟢 Green - Success

**Meaning**: Layer meets all quality criteria

**Criteria**:
- ✅ Has data or statistics
- ✅ Has attribution
- ✅ Has legend (or none needed)
- ✅ Swipe layer is complete (if applicable)

**Action**: None needed - layer is production-ready

### QA Exclusions

**Base Layers** are excluded from QA statistics because:
- They use standard base maps
- Attribution is typically built-in
- They don't require custom legends

### Viewing Layer QA Status

**On Layer Cards**:
- QA icon appears in top-right corner
- Hover for detailed tooltip
- Click for more information

**In Home Tab Summary**:
- Total count of each status level
- Percentage of layers with issues
- Quick links to problematic layers

## Data Source Validation

### What is Data Source Validation?

Comprehensive validation system that checks entire configuration for errors and warnings across all layers.

### Validation Categories

#### 1. Schema Validation

**What it checks**:
- Configuration structure matches required schema
- All required fields present
- Field types are correct
- Value constraints satisfied

**Common Issues**:
- Missing layer name
- Invalid format specification
- Incorrect data type (string vs number)
- Missing required nested fields

**How to Fix**:
1. Review validation error details
2. Edit affected layer or setting
3. Correct the field
4. Save and re-validate

#### 2. URL Validation

**What it checks**:
- URLs are properly formatted
- Required URL components present
- URL protocol is valid (http/https)

**Common Issues**:
- Malformed URLs
- Missing protocol (http://)
- Invalid characters in URL
- Incomplete URLs

**How to Fix**:
1. Check URL format
2. Verify protocol included
3. Test URL accessibility
4. Update and save

#### 3. Reference Validation

**What it checks**:
- Swipe layers reference existing layers
- Interface group references are valid
- Service references exist
- Exclusivity sets reference valid layers

**Common Issues**:
- Swipe layer references deleted layer
- Layer assigned to non-existent group
- Service reference broken

**How to Fix**:
1. Identify missing reference
2. Either create missing resource
3. Or update reference to valid resource
4. Save

#### 4. Completeness Validation

**What it checks**:
- Recommended fields present
- Attribution provided
- Legends configured where appropriate

**Common Issues**:
- Missing attribution (warning level)
- No legend for data layer (info level)
- Empty descriptions

**How to Fix**:
1. Add missing recommended fields
2. Configure attribution
3. Set up legends
4. Save

### Accessing Validation Results

**Method 1: Home Tab**
1. Go to Home tab
2. View "Configuration Status" card
3. See error and warning counts
4. Click for detailed report

**Method 2: Validation Dialog**
1. Click "Validate" in top navigation
2. Full validation report opens
3. Shows all issues by category
4. Click issue to jump to layer

### Understanding Validation Reports

#### Error Report Structure

```
❌ Layer "Land Cover 2020"
   - Missing required field: data.url
   - Invalid format: format must be one of [COG, FlatGeobuf, WMS, WMTS, XYZ]

⚠️ Layer "Temperature"
   - Missing recommended field: attribution.text
   - No legend configured
```

#### Report Sections

1. **Critical Errors**: Must fix before export
2. **Warnings**: Should fix before production
3. **Info**: Enhancement suggestions
4. **Summary**: Total counts by severity

### Validation Best Practices

**When to Validate**:
- After adding multiple layers
- Before exporting configuration
- After major structural changes
- Before deployment

**Validation Workflow**:
1. Make configuration changes
2. Run validation
3. Fix critical errors first
4. Address warnings
5. Consider info suggestions
6. Re-validate
7. Export when clean

## QA Statistics Dashboard

### Home Tab QA Overview

The Home tab provides comprehensive QA statistics:

#### Layer Quality Stats

- **Total Layers**: Count of all layers (excluding base)
- **Errors**: Layers with critical issues (red)
- **Warnings**: Layers with recommended fixes (amber)
- **Info**: Layers with enhancement opportunities (blue)
- **Success**: Fully compliant layers (green)

#### Percentage Metrics

- **Completion Rate**: (Green layers / Total layers) × 100%
- **Issue Rate**: ((Red + Amber) / Total layers) × 100%
- **Critical Rate**: (Red layers / Total layers) × 100%

#### Visual Indicators

- Color-coded stat cards
- Progress bars showing distribution
- Trend indicators (improving/declining)

### Using QA Stats

**Goal Setting**:
- Target 100% green before production
- Minimize red (critical) to 0%
- Reduce amber to <10%

**Progress Tracking**:
- Monitor stats as you work
- Track improvements over time
- Identify problematic layer types

## Batch QA Operations

### Fixing Multiple Layers

**Batch Attribution**:
1. Select layers with missing attribution
2. Click "Batch Edit"
3. Apply common attribution
4. Save all

**Batch Legend**:
1. Identify layers missing legends
2. Configure similar layers together
3. Use "Copy from Layer" feature
4. Apply to multiple layers

### QA Filtering

**Filter by QA Status**:
1. Go to Layers tab
2. Click QA filter dropdown
3. Select status level (red/amber/blue/green)
4. View only layers with that status
5. Fix systematically

## Common QA Issues and Fixes

### Issue: Missing Data URLs

**Symptoms**: Red QA status, layer doesn't load

**Solution**:
1. Edit layer
2. Configure data source (service or direct URL)
3. Verify URL is accessible
4. Save

### Issue: Missing Attribution

**Symptoms**: Amber QA status

**Solution**:
1. Edit layer
2. Add attribution text (e.g., "© ESA 2024")
3. Add URL if available
4. Save

### Issue: Incomplete Swipe

**Symptoms**: Amber QA status on swipe layer

**Solution**:
1. Edit swipe layer
2. Set clipped source (left side)
3. Add base source (right side)
4. Save

### Issue: Missing Legend

**Symptoms**: Blue QA status

**Solution**:
1. Edit layer
2. Choose appropriate legend type
3. Configure categories or colormap
4. Save

## Pre-Export QA Checklist

Before exporting to production:

### Critical Requirements
- [ ] No red (error) status layers
- [ ] All swipe layers have clipped and base sources
- [ ] All layers have valid data URLs

### Recommended Standards
- [ ] All layers have attribution
- [ ] Data layers have legends
- [ ] Layer names are descriptive
- [ ] Layers organized in groups

### Best Practices
- [ ] Descriptions provided for complex layers
- [ ] Time controls configured for temporal data
- [ ] Draw order optimized
- [ ] Base layers configured
- [ ] Preview tested successfully

## QA Automation

### Automatic Checks

The system automatically:
- Validates on layer save
- Updates QA status in real-time
- Checks on configuration export
- Warns before deploying with errors

### Continuous Monitoring

- QA status visible at all times
- Changes update immediately
- Dashboard reflects current state
- No manual refresh needed

## Advanced QA

### Custom Validation Rules

Organizations may define custom rules:
- Required attribution format
- Mandatory legend types
- Naming conventions
- Data source requirements

### QA Reports

Generate QA reports for:
- Team review
- Quality audits
- Documentation
- Progress tracking

**Export QA Report**:
1. Go to Home tab
2. Click "Export QA Report"
3. Select format (JSON/CSV)
4. Save report

## Keyboard Shortcut

**Quick Access to Documentation**:
- Press `Ctrl + Shift + H` to open this user guide
- Works from any tab
- Opens in new window

---

[← Previous: Preview & Export](./preview-export.md) | [Next: Troubleshooting →](./troubleshooting.md)
