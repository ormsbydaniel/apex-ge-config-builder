import { ViewerVersion } from '@/types/viewer';
import { VIEWER_BUCKET_LIST_URL, VIEWER_BUNDLE_BASE_URL } from '@/config/viewerBundleConfig';

/**
 * Fetch available viewer versions by listing S3 bucket prefixes.
 * Uses the ListObjectsV2 API with prefix=software/ and delimiter=/ to get version "folders".
 * S3 returns CommonPrefixes like "software/3.6.0/" — we strip the prefix to get "3.6.0".
 */
export async function getAvailableViewerVersions(): Promise<ViewerVersion[]> {
  try {
    const response = await fetch(VIEWER_BUCKET_LIST_URL);
    if (!response.ok) {
      console.error('Failed to list S3 bucket contents:', response.status);
      return [];
    }

    const xml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const prefixes = doc.querySelectorAll('CommonPrefixes > Prefix');

    const versions: ViewerVersion[] = Array.from(prefixes)
      .map(p => {
        // Prefix comes back as "software/3.6.0/" — strip leading prefix and trailing slash
        const raw = p.textContent || '';
        return raw.replace(/^software\//, '').replace(/\/$/, '');
      })
      .filter(v => v.length > 0)
      .map(version => ({
        version,
        path: `${VIEWER_BUNDLE_BASE_URL}${version}/bundle.js`,
      }));

    return versions;
  } catch (error) {
    console.error('Error fetching viewer versions from S3:', error);
    return [];
  }
}

/**
 * Get the latest version by sorting all discovered versions.
 */
export async function getLatestVersionFromManifest(): Promise<string | null> {
  try {
    const versions = await getAvailableViewerVersions();
    const latest = getLatestVersion(versions);
    return latest?.version || null;
  } catch (error) {
    console.error('Error determining latest version:', error);
    return null;
  }
}

/**
 * Parse and compare semantic versions.
 * Returns negative if a > b, positive if a < b, 0 if equal.
 * Non-semver strings (e.g. "dev-3-6-0-candidate") sort after valid semver.
 */
export function compareVersions(a: string, b: string): number {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  const aIsSemver = semverRegex.test(a);
  const bIsSemver = semverRegex.test(b);

  // Non-semver versions sort to the end
  if (aIsSemver && !bIsSemver) return -1;
  if (!aIsSemver && bIsSemver) return 1;
  if (!aIsSemver && !bIsSemver) return a.localeCompare(b);

  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal > bVal) return -1;
    if (aVal < bVal) return 1;
  }

  return 0;
}

/**
 * Get the latest version from a list of versions
 */
export function getLatestVersion(versions: ViewerVersion[]): ViewerVersion | null {
  if (versions.length === 0) return null;
  return versions.sort((a, b) => compareVersions(a.version, b.version))[0];
}

const VIEWER_VERSION_KEY = 'apex-viewer-version';
const VERSION_ALERT_SHOWN_KEY = 'apex-viewer-update-alert-shown';

export function getSavedViewerVersion(): string | null {
  return localStorage.getItem(VIEWER_VERSION_KEY);
}

export function saveViewerVersion(version: string): void {
  localStorage.setItem(VIEWER_VERSION_KEY, version);
}

export function hasShownVersionAlertThisSession(): boolean {
  return sessionStorage.getItem(VERSION_ALERT_SHOWN_KEY) === 'true';
}

export function markVersionAlertAsShown(): void {
  sessionStorage.setItem(VERSION_ALERT_SHOWN_KEY, 'true');
}
