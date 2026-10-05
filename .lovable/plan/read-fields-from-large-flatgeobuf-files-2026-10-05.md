# Read fields from large FlatGeobuf files

## Problem
On the Field Boundaries layer (Vector Datasets config), Manage Fields shows "No fields found" and Vector styling says "Couldn't read attributes from the data". Small FlatGeobuf files work: tested in the browser, the ESA NUTS files gave 22 fields and 20 sampled attributes. So file size is the likely cause.

- Vector styling sampling downloads the **whole file** before reading anything. For a big file this is slow, uses a lot of memory, and can fail.
- Field detection is meant to read only the file's header (the part that lists column names). But how it reads the stream is fragile, and any failure ends up as the generic "No fields found".

## Fix
1. **Confirm the cause first.** Load the Field Boundaries config from the manifest, take its FlatGeobuf URL, and check its size and the server headers (file size, cross-site access, partial downloads). Then run both read paths against it to see exactly where it fails.
2. **Header-only reads for field names.** Stream the file, stop as soon as the header has been read, then close the download. This takes a few kilobytes, not the whole file.
3. **Streamed sampling for styling.** Read features one at a time from the stream and stop after the sample limit (500 features). Never load the whole file.
4. **Fall back when the header lists no columns.** Some files store no column list in the header. In that case, read the first few features and take field names from them.
5. **Clearer messages.** Tell "could not reach the file" apart from "the file has no fields", so the toast and the styling warning match what actually went wrong.

## Technical details
- `src/utils/flatgeobufMetadata.ts`: pass the `response.body` ReadableStream to `deserialize` with a header callback. After the header arrives, cancel the reader or use an `AbortController`. Handle files that have no features but do have a header.
- `src/utils/vectorStyle/sampleSourceData.ts`, `sampleFlatGeobuf`: replace `arrayBuffer()` with stream deserialization. Break at `limit` and abort the fetch.
- `src/utils/fieldDetection.ts`, `detectFieldsFromFlatGeoBuf`: when there are zero header columns, fall back to the properties of the first features.
- Surface error text in `FieldsEditorTabs.tsx` (populate toast) and `VectorStylingDialog.tsx`, instead of a generic empty result.
- Add focused unit tests using a small serialized FlatGeobuf: the stream stops early, there are no full-buffer reads, and the header-without-columns fallback works.
- No changes to the schema or saved config.
