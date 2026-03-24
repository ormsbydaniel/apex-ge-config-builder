

## Hide Select Button for Unsupported Formats

### Problem
Files with unsupported formats still show a "Select" button, which is misleading since selecting them won't work properly.

### Change — `src/components/form/S3LayerSelector.tsx`

In the file row rendering (around line 315-343), conditionally render the "Select" button only when `detectedFormat` is truthy (i.e., a supported format was detected). For unsupported files, show a muted "Unsupported" text label instead.

```tsx
// Replace the unconditional Select button with:
{detectedFormat ? (
  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">
    Select
  </Button>
) : (
  <span className="text-[10px] text-muted-foreground italic shrink-0">Unsupported</span>
)}
```

### Files Modified
1. `src/components/form/S3LayerSelector.tsx`

