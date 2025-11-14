# Import Transformations System

## Overview

The import transformations system handles the conversion of configuration files from various formats and versions into the application's internal format. It provides a modular, extensible architecture for detecting and applying transformations to imported configurations.

## Architecture

The system follows a **Detector-Transformer-Orchestrator** pattern:

```
┌─────────────┐
│   Import    │
│   Config    │
└──────┬──────┘
       │
       v
┌─────────────────┐
│   Orchestrator  │  ← Coordinates transformation flow
└────────┬────────┘
         │
         v
┌─────────────────┐
│    Detectors    │  ← Identify needed transformations
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Transformers   │  ← Apply transformations
└────────┬────────┘
         │
         v
┌─────────────────┐
│   Transformed   │
│     Config      │
└─────────────────┘
```

## Key Components

### 1. Orchestrators

**Location:** `src/utils/importTransformations/orchestrator.ts`, `iterativeOrchestrator.ts`

**Purpose:** Coordinate the detection and application of transformations.

**Types:**
- **orchestrator.ts**: Single-pass orchestration for independent transformations
- **iterativeOrchestrator.ts**: Multi-pass orchestration for interdependent transformations

**Example:**
```typescript
export const applyImportTransformations = (config: any): any => {
  let transformedConfig = { ...config };
  
  // Apply transformations in order
  transformedConfig = applySingleItemTransformation(transformedConfig);
  transformedConfig = applyBaseLayerTransformation(transformedConfig);
  // ... more transformations
  
  return transformedConfig;
};
```

### 2. Detectors

**Location:** `src/utils/importTransformations/detection/`

**Purpose:** Analyze configuration to determine which transformations are needed.

**Pattern:**
```typescript
export const detectTransformation = (config: any): boolean => {
  // Logic to determine if transformation is needed
  return needsTransformation;
};
```

**Available Detectors:**
- `baseLayerDetector.ts` - Detects old base layer format
- `baseLayerPreviewDetector.ts` - Detects missing preview fields
- `cogDetector.ts` - Detects COG format configurations
- `exclusivitySetsDetector.ts` - Detects exclusivity set patterns
- `formatToTypeDetector.ts` - Detects format-to-type conversion needs
- `metaCompletionDetector.ts` - Detects incomplete metadata
- `singleItemDetector.ts` - Detects single-item arrays that should be objects
- `swipeLayerDetector.ts` - Detects swipe layer configurations
- `typeToFormatDetector.ts` - Detects type-to-format conversion needs

### 3. Transformers

**Location:** `src/utils/importTransformations/transformers/`

**Purpose:** Apply specific transformations to configuration data.

**Pattern:**
```typescript
export const applyTransformation = (config: any): any => {
  const transformed = { ...config };
  
  // Apply transformation logic
  // Modify transformed config
  
  return transformed;
};
```

**Available Transformers:**
- `baseLayerTransformer.ts` - Transforms base layer structure
- `baseLayerPreviewTransformer.ts` - Adds preview fields to base layers
- `cogTransformer.ts` - Configures COG format layers
- `exclusivitySetsTransformer.ts` - Transforms exclusivity set structures
- `formatToTypeTransformer.ts` - Converts format field to type field
- `metaCompletionTransformer.ts` - Completes missing metadata
- `serviceNormalizer.ts` - Normalizes service configurations
- `singleItemTransformer.ts` - Converts single-item arrays to objects
- `swipeLayerTransformer.ts` - Transforms swipe layer configurations
- `temporalTransformer.ts` - Transforms temporal configurations
- `typeToFormatTransformer.ts` - Converts type field to format field

### 4. Utilities

**Location:** `src/utils/importTransformations/utils/`

**Purpose:** Provide helper functions for transformers and detectors.

**Available Utilities:**
- `arrayHelpers.ts` - Array manipulation utilities
- `sourceHelpers.ts` - Data source helper functions

## Transformation Flow

### Standard Flow (Single-Pass)

1. **Import** - User imports a configuration file
2. **Detect** - Run all detectors to identify needed transformations
3. **Transform** - Apply transformations in dependency order
4. **Validate** - Validate the transformed configuration
5. **Load** - Load the configuration into the application

### Iterative Flow (Multi-Pass)

Used when transformations have dependencies on each other:

1. **Initial Pass** - Apply all detected transformations
2. **Re-detect** - Check if new transformations are needed
3. **Transform Again** - Apply newly detected transformations
4. **Repeat** - Continue until no new transformations are detected
5. **Validate & Load** - Final validation and loading

## Adding New Transformations

### Step 1: Create a Detector

Create a new file in `src/utils/importTransformations/detection/`:

```typescript
// myNewDetector.ts
export const detectMyNewTransformation = (config: any): boolean => {
  // Check if transformation is needed
  if (config.someField === 'oldFormat') {
    return true;
  }
  return false;
};
```

### Step 2: Create a Transformer

Create a new file in `src/utils/importTransformations/transformers/`:

```typescript
// myNewTransformer.ts
export const applyMyNewTransformation = (config: any): any => {
  const transformed = { ...config };
  
  // Apply your transformation
  if (transformed.someField === 'oldFormat') {
    transformed.someField = 'newFormat';
  }
  
  return transformed;
};
```

### Step 3: Register in Detector

Add to `src/utils/importTransformations/detector.ts`:

```typescript
import { detectMyNewTransformation } from './detection/myNewDetector';

export const detectTransformations = (config: any): DetectedTransformations => {
  return {
    // ... existing detections
    myNewTransformation: detectMyNewTransformation(config),
  };
};
```

### Step 4: Add to Orchestrator

Add to `src/utils/importTransformations/orchestrator.ts`:

```typescript
import { applyMyNewTransformation } from './transformers/myNewTransformer';

export const applyImportTransformations = (config: any): any => {
  let transformedConfig = { ...config };
  
  // ... existing transformations
  transformedConfig = applyMyNewTransformation(transformedConfig);
  
  return transformedConfig;
};
```

## Best Practices

### 1. Keep Transformations Independent

Each transformation should be self-contained and not depend on other transformations being applied first (when possible).

### 2. Maintain Backward Compatibility

Always support legacy formats. Never remove transformation logic that handles old formats.

### 3. Test Thoroughly

Test transformations with:
- Minimal valid configurations
- Complex real-world configurations
- Edge cases and malformed data

### 4. Document Transformations

Each transformer should include:
- Purpose comment explaining what it transforms
- Example of input and output
- Any edge cases or limitations

### 5. Use Type Guards

When working with complex types, use type guards to ensure type safety:

```typescript
function isOldFormat(config: any): config is OldFormatType {
  return 'oldField' in config;
}

if (isOldFormat(config)) {
  // Transform with type safety
}
```

## Common Patterns

### Pattern 1: Array-to-Object Transformation

```typescript
export const transformArrayToObject = (config: any): any => {
  if (Array.isArray(config.items) && config.items.length === 1) {
    return { ...config, item: config.items[0] };
  }
  return config;
};
```

### Pattern 2: Field Renaming

```typescript
export const renameField = (config: any): any => {
  if ('oldName' in config) {
    const { oldName, ...rest } = config;
    return { ...rest, newName: oldName };
  }
  return config;
};
```

### Pattern 3: Nested Transformation

```typescript
export const transformNested = (config: any): any => {
  const transformed = { ...config };
  
  if (transformed.layers) {
    transformed.layers = transformed.layers.map((layer: any) => ({
      ...layer,
      // Apply transformation to each layer
    }));
  }
  
  return transformed;
};
```

## Troubleshooting

### Transformation Not Applied

1. Check if detector returns `true`
2. Verify transformation is registered in orchestrator
3. Check transformation order (dependencies)
4. Verify input format matches expected pattern

### Transformation Applied Incorrectly

1. Log input and output at transformation boundaries
2. Check for unintended side effects from other transformations
3. Verify deep cloning is working correctly
4. Test transformation in isolation

### Performance Issues

1. Use iterative orchestrator only when needed
2. Avoid nested loops in transformations
3. Cache detector results when appropriate
4. Consider batching similar transformations

## Future Enhancements

Potential areas for improvement:

1. **Transformation Validation** - Add schema validation after each transformation
2. **Transformation Metadata** - Track which transformations were applied
3. **Reversible Transformations** - Support export transformations that reverse imports
4. **Transformation Logging** - Enhanced logging for debugging
5. **Parallel Transformations** - Apply independent transformations in parallel
6. **Transformation Conflicts** - Detect and handle conflicting transformations

## Related Documentation

- **Export Transformations**: See `src/utils/exportTransformations/`
- **Configuration Schema**: See `src/schemas/configSchema.ts`
- **Type Definitions**: See `src/types/`
