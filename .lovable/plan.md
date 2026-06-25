## Restyle User Guide + Export toolbar

Apply the selected "Grouped container + labels" direction to the two utility buttons above the tab bar in `src/components/ConfigBuilder.tsx`.

### Changes (single file)

Replace the two standalone `TooltipProvider` button blocks (and the wrapping `<div className="flex justify-end gap-2 mb-3">`) with a single grouped container:

```tsx
<div className="flex justify-end mb-3">
  <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
    <a
      href="/guide/index.html"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all group"
    >
      <BookOpen className="h-5 w-5 opacity-80 group-hover:opacity-100" />
      <span className="text-xs font-semibold tracking-wide uppercase">User Guide</span>
    </a>

    <div className="w-px h-6 bg-white/10 mx-1" />

    <button
      type="button"
      onClick={() => exportConfig()}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all group cursor-pointer"
    >
      <Download className="h-5 w-5 opacity-80 group-hover:opacity-100" />
      <span className="text-xs font-semibold tracking-wide uppercase">Export</span>
    </button>
  </div>
</div>
```

### Notes

- Drops the now-redundant `Tooltip`s — labels are visible inline.
- Keeps both icons (`BookOpen`, `Download`) and both actions (open guide in new tab, call `exportConfig()`) unchanged.
- Uses translucent `white/*` utilities so the group reads as a quiet secondary surface against the dark teal shell, distinct from the white primary tab bar below.
- No other components, no schema or context changes.