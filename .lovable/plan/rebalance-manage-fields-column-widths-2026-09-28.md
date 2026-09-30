# Rebalance Manage Fields column widths

## Changes

Only two files, only width classes:

1. **`src/components/form/FieldItem.tsx`**
   - Display label column: widen — make it the flexible column (`w-auto min-w-[110px]`) so it absorbs the space freed by the prefix/suffix columns instead of being squeezed to 32px.
   - Prefix column: narrow back from `w-[140px]` to `w-[100px]`.
   - Suffix column: narrow back from `w-[132px]` to `w-[100px]`.

2. **`src/components/form/FieldsEditorDialog.tsx`**
   - Revert dialog width from `sm:max-w-[944px]` back to `sm:max-w-[1024px]`.

## Verification

None by me — the user will test in the preview and give feedback. Only check the build log shows OK.
