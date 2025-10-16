import { ViewerVersion } from '@/types/viewer';

/**
 * Fetch available viewer versions from the public/viewer directory
 * This checks for directories matching semantic versioning pattern
 */
export async function getAvailableViewerVersions(): Promise<ViewerVersion[]> {
  try {
    // In production, we need to know versions ahead of time or use a manifest
    // For now, we'll try common version patterns
    const knownVersions = [
      '3.2.2',
      '3.2.1',
      '3.2.0',
      '3.1.0',
      '3.0.0',
    ];
    
    const availableVersions: ViewerVersion[] = [];
    
    for (const version of knownVersions) {
      const path = `/viewer/${version}/bundle.js`;
      try {
        const response = await fetch(path, { method: 'HEAD' });
        if (response.ok) {
          availableVersions.push({ version, path });
        }
      } catch {
        // Version not available, skip
      }
    }
    
    return availableVersions;
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
