

## Fix: Update "No viewer versions found" error message

The error message at lines 146-150 of `src/pages/Preview.tsx` still references the old local bundle approach (`public/viewer/`). It needs to reference the S3 bucket hosting approach.

### Change

Replace the message content (lines 146-151) with text explaining that versions are loaded from the S3 bucket and that no version folders were found there. Reference the S3 bucket URL from `viewerBundleConfig.ts` and explain the expected structure (e.g., `software/3.6.0/bundle.js`).

The updated message should read something like:

> **No viewer versions found**
>
> No viewer bundles were found in the S3 bucket. Viewer bundles should be uploaded to the S3 bucket at `https://esa-apex.s3.eu-west-1.amazonaws.com/software/` using semantic versioning (e.g., `software/3.6.0/bundle.js`).

This is a single-line text change in `src/pages/Preview.tsx`, no other files affected.

