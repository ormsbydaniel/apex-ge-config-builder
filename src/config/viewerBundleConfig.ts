/**
 * Configuration for loading viewer bundles from S3.
 * 
 * Bundles are hosted in a public S3 bucket with versioned folders.
 * S3 serves files with correct MIME types, so no workarounds are needed.
 * 
 * Bucket structure:
 *   {VIEWER_BUNDLE_BASE_URL}/
 *     3.5.0/bundle.js
 *     3.5.0/bundle.css
 *     3.6.0/bundle.js
 *     3.6.0/bundle.css
 *     3.6.0/assets/chunk-*.js
 */

// TODO: Replace with your actual S3 bucket URL once created
const S3_BUCKET_URL = 'https://apex-viewer-bundles.s3.eu-west-2.amazonaws.com';

/**
 * Base URL for the S3 bucket (used for listing versions).
 */
export const VIEWER_BUCKET_URL = S3_BUCKET_URL;

/**
 * Base URL for fetching viewer bundle files from S3.
 */
export const VIEWER_BUNDLE_BASE_URL = S3_BUCKET_URL;

/**
 * Get the full URL for a viewer bundle file.
 */
export function getViewerBundleUrl(version: string, filename: string): string {
  return `${VIEWER_BUNDLE_BASE_URL}/${version}/${filename}`;
}
