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

const S3_BUCKET_ROOT = "https://esa-apex.s3.eu-west-1.amazonaws.com";
const S3_PREFIX = "software/";

/**
 * URL for listing S3 bucket contents (ListObjectsV2 with prefix).
 */
export const VIEWER_BUCKET_LIST_URL = `${S3_BUCKET_ROOT}/?list-type=2&delimiter=/&prefix=${S3_PREFIX}`;

/**
 * Base URL for fetching viewer bundle files from S3.
 * Files are at: {VIEWER_BUNDLE_BASE_URL}/{version}/bundle.js
 */
export const VIEWER_BUNDLE_BASE_URL = `${S3_BUCKET_ROOT}/${S3_PREFIX}`;

/**
 * Get the full URL for a viewer bundle file.
 */
export function getViewerBundleUrl(version: string, filename: string): string {
  return `${VIEWER_BUNDLE_BASE_URL}${version}/${filename}`;
}
