

## Make Category Badges More Subtle

The category badges currently inherit `font-semibold` from the base Badge component and use `border-primary/30` which gives them a noticeable border. To make them lighter and more inline with the muted sub-section style:

### Changes — `LayerDataVisualisationSection.tsx` (line 62)

Update the Badge styling from:
```tsx
<Badge variant="outline" className="text-xs border-primary/30">
```
to:
```tsx
<Badge variant="outline" className="text-[11px] font-normal text-muted-foreground border-border/50 py-0 px-1.5">
```

Key adjustments:
- **`font-normal`** — overrides the `font-semibold` from the Badge base, making text lighter
- **`text-[11px]`** — slightly smaller than `text-xs` for a more compact feel
- **`text-muted-foreground`** — softer text color instead of default foreground
- **`border-border/50`** — lighter, neutral border instead of primary-tinted
- **`py-0 px-1.5`** — tighter padding for a more tag-like appearance

Single file change, one line update.

