import { ViewerVersion } from '@/types/viewer';

/**
 * Fetch available viewer versions from the versions.json manifest
 */
export async function getAvailableViewerVersions(): Promise<ViewerVersion[]> {
  try {
    const response = await fetch('/viewer/versions.json');
    if (!response.ok) {
      console.error('Failed to fetch versions manifest');
      return [];
    }
    
    const data = await response.json();
    const versions: ViewerVersion[] = data.versions.map((version: string) => ({
      version,
      path: `/viewer/${version}/bundle.js`
    }));
    
    return versions;
  } catch (error) {
    console.error('Error fetching viewer versions:', error);
    return [];
  }
}

/**
 * Parse and compare semantic versions
 */
export function compareVersions(a: string, b: string): number {
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

export function getSavedViewerVersion(): string | null {
  return localStorage.getItem(VIEWER_VERSION_KEY);
}

export function saveViewerVersion(version: string): void {
  localStorage.setItem(VIEWER_VERSION_KEY, version);
}
