## Free up tab bar space

The tab row added a 9th tab (Storymaps), pushing the Preview tab off-screen on narrower viewports. Move the two utility icon-buttons (User Guide, Export) out of the tab row so the `TabsList` reclaims full width.

### Changes

`src/components/ConfigBuilder.tsx` only:

1. Remove the User Guide `<a>` and Export `<Button>` (and their wrapping `TooltipProvider`s) from inside the `flex` row at lines ~286–319.
2. Drop the now-unnecessary `flex items-center gap-2 mb-6` wrapper around `TabsList` and put the two icon buttons in a new right-aligned row directly above it, e.g.:

```tsx
<div className="flex justify-end gap-2 mb-3">
  {/* User Guide link */}
  {/* Export button */}
</div>
<TabsList className="grid w-full grid-cols-9 bg-white border border-primary/20 mb-6">
  ...
</TabsList>
```

3. Update grid column count from `grid-cols-8` to `grid-cols-9` so all nine tab triggers (Home, Layers, Draw Order, Algorithms, Storymaps, Services, Settings, JSON Config, Preview) share the row evenly.

No behaviour changes — same buttons, same tabs, just rearranged so the toolbar fits.