

## Problem

OTC OBS buckets don't support the `delimiter` query parameter in the same way as AWS S3. When `delimiter=/` is included, the OBS API returns no objects. Without it, objects are returned correctly.

The current code in `fetchS3BucketFolder()` always sends `delimiter=/` to enable hierarchical folder browsing. This works for AWS S3 but breaks OTC OBS.

## Solution

Add a **fallback strategy** in `fetchS3BucketFolder()`: if the initial request with `delimiter` returns zero folders and zero files, retry without the `delimiter` parameter and derive the folder structure client-side using the existing `deriveFolderListingFromObjects()` function.

This is non-destructive — AWS S3 buckets continue working as before, and OBS buckets get automatic recovery.

## Changes

**File: `src/utils/s3Utils.ts`**

Modify `fetchS3BucketFolder()`:

1. After the current fetch + parse logic (line ~280), check if both `folders` and `files` are empty.
2. If empty, retry the request **without** the `delimiter` parameter (just `list-type=2`, `max-keys=1000`, and optionally `prefix`).
3. Parse the flat object list from the retry response.
4. Pass the flat list through `deriveFolderListingFromObjects(objects, prefix)` to reconstruct the folder/file hierarchy client-side.
5. Return that derived result.

This reuses the existing `deriveFolderListingFromObjects` helper which already handles exactly this scenario (it's currently used for cached/uploaded data).

