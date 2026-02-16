/**
 * Configuration for loading viewer bundles.
 * 
 * Bundles are fetched from jsDelivr CDN (which serves GitHub files with correct MIME types)
 * since they exceed Lovable's file size limits for the local repository.
 * 
 * Older versions that exist locally (committed before the size limit was hit)
 * will fall back to local paths automatically.
 */

const GITHUB_OWNER = 'ormsbydaniel';
const GITHUB_REPO = 'apex-ge-config-builder';
const GITHUB_BRANCH = '3-6-release';

/**
 * jsDelivr CDN base URL for serving viewer bundles with correct MIME types.
 * raw.githubusercontent.com doesn't set Content-Type for JS modules, so jsDelivr is required.
 */
export const VIEWER_BUNDLE_BASE_URL = 
  `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@${GITHUB_BRANCH}/public/viewer`;

/**
 * Get the full URL for a viewer bundle file.
 */
export function getViewerBundleUrl(version: string, filename: string): string {
  return `${VIEWER_BUNDLE_BASE_URL}/${version}/${filename}`;
}
