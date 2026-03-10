

## Make Colormap Badges More Subtle

Apply the same subtle styling pattern used for category badges to the colormap badges on the layer card.

### Changes — `LayerDataVisualisationSection.tsx`

**Badge container (line 99):** Change from `variant="secondary"` with default padding to a lighter outline style:
```tsx
// From:
<Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">

// To:
<Badge key={index} variant="outline" className="flex items-center gap-2 px-2 py-0.5 border-border/50">
```

**Text styling (lines 106-111):** Reduce size and weight to match the subtle metadata pattern:
```tsx
// From:
<div className="flex flex-col text-xs">
  <span className="font-medium">{colormap.name}</span>
  <span className="text-muted-foreground">

// To:
<div className="flex flex-col text-[11px]">
  <span className="font-normal text-muted-foreground">{colormap.name}</span>
  <span className="text-muted-foreground/70">
```

**Delete icon (line 119):** Slightly smaller to match:
```tsx
<Trash2 className="h-3 w-3" />
```

**Color ramp preview (lines 103-104):** Slightly smaller to fit the more compact badge:
```tsx
width={50} height={14}
```

Single file, four small tweaks.

