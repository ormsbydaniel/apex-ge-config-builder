/**
 * Configuration for loading viewer bundles from GitHub.
 * 
 * Bundles are fetched from raw.githubusercontent.com since they exceed
 * Lovable's file size limits for the local repository.
 * 
 * Note: raw.githubusercontent.com serves files with text/plain MIME type,
 * so bundles must be loaded as classic scripts (not ES modules).
 */

const GITHUB_OWNER = 'ormsbydaniel';
const GITHUB_REPO = 'apex-ge-config-builder';
const GITHUB_BRANCH = '3-6-release';

/**
 * Base URL for fetching viewer bundle files from GitHub.
 * Points to: public/viewer/{version}/ in the repo.
 */
export const VIEWER_BUNDLE_BASE_URL = 
  `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/public/viewer`;

/**
 * Get the full URL for a viewer bundle file.
 */
export function getViewerBundleUrl(version: string, filename: string): string {
  return `${VIEWER_BUNDLE_BASE_URL}/${version}/${filename}`;
}
