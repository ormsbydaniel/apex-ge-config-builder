

## Add Interleave Method to COG Metadata Display

**Single change** in `src/utils/cogMetadata.ts`, in `formatMetadataForDisplay`, after the Tile Size line (~line 531):

```ts
if (metadata.samplesPerPixel !== undefined && metadata.samplesPerPixel > 1) {
  const interleave = metadata.planarConfiguration === 2
    ? 'Band Sequential (BSQ)'
    : 'Pixel Interleaved (BIP)';
  imageProps.push({ label: 'Interleave', value: interleave });
}
```

Only shown for multi-band files. No interface or schema changes needed — `planarConfiguration` is already on `CogMetadata` and already fetched from TIFF headers.

