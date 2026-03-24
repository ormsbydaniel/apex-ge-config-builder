

## S3 Bucket Folder Browsing with Breadcrumbs

### Overview
Refactor the S3LayerSelector to browse S3 buckets by folder structure instead of showing a flat list. Users navigate folders via clickable breadcrumbs. Search, format filter, and "Add All Objects" operate within the current folder scope.

### Changes

**1. `src/utils/s3Utils.ts` — Add prefix-based listing**

Add a new function `fetchS3BucketFolder` that uses the S3 ListObjectsV2 API with `delimiter=/` and `prefix=` parameters. This returns both:
- **CommonPrefixes** → subfolders at the current level
- **Contents** → files at the current level (excluding the folder marker itself)

Returns a new type:

```typescript
export interface S3FolderListing {
  folders: string[];    // e.g. ["data/", "outputs/"]
  files: S3Object[];    // files at this prefix level
}
```

The function signature: `fetchS3BucketFolder(bucketUrl: string, prefix: string): Promise<S3FolderListing>`

Also add a helper to extract the display name from a key/prefix (last path segment).

**2. `src/components/form/S3LayerSelector.tsx` — Folder navigation + breadcrumbs**

State additions:
- `currentPrefix: string` (starts as `""` for root)
- `folders: string[]` (subfolders at current level)

Behaviour changes:
- On load and when `currentPrefix` changes, call `fetchS3BucketFolder(bucketUrl, currentPrefix)` to get folders and files for that level
- **Breadcrumb bar** at top shows the path segments as clickable links (root → folder1 → subfolder2). Clicking a segment navigates to that prefix. Uses `ChevronRight` separators similar to the existing `JsonBreadcrumb` component pattern.
- **Folders** rendered above files as clickable rows with a `Folder` icon. Clicking sets `currentPrefix` to that folder's full prefix.
- **Files** rendered as before (with Select button, format badge, size, date)
- Search filters files within the current folder only
- Format filter applies to files in the current folder only
- "Add All Objects" adds all filtered files in the current folder
- Status text updated: "Showing X files in Y folders at current path"

For **cached data** (from file uploads with capabilities), derive folder structure client-side by grouping object keys by their path segments relative to `currentPrefix`.

**3. Visual layout**

```text
┌──────────────────────────────────────────────┐
│ 🏠 Root > data > outputs                     │  ← breadcrumb bar
├──────────────────────────────────────────────┤
│ [Search Objects...] [Filter by Format ▾]     │
├──────────────────────────────────────────────┤
│ 📁 subfolder-a/                              │  ← folder rows
│ 📁 subfolder-b/                              │
├──────────────────────────────────────────────┤
│ 📄 output.tif  COG  2.3MB  2026-03-20  [Sel]│  ← file rows
│ 📄 result.fgb  FGB  1.1MB  2026-03-19  [Sel]│
├──────────────────────────────────────────────┤
│ [Add All Objects (2)]                         │
│ Showing 2 files, 2 folders                   │
└──────────────────────────────────────────────┘
```

### Files Modified
1. `src/utils/s3Utils.ts` — add `S3FolderListing` type and `fetchS3BucketFolder` function
2. `src/components/form/S3LayerSelector.tsx` — add folder state, breadcrumb navigation, folder/file split rendering

### Notes
- The existing `fetchS3BucketContents` function remains unchanged (used by `useServices.ts` for capabilities fetching which needs the flat list)
- No schema or type changes needed
- The S3 ListObjectsV2 API natively supports `delimiter` and `prefix` — no pagination changes needed for typical bucket sizes

