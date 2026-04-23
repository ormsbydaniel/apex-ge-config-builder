/**
 * Best-effort fetch of an OGC service title via GetCapabilities.
 * Returns null on any error (no toasts) — used for UX auto-population.
 */

type OgcFormat = 'wms' | 'wmts' | 'wfs';

export async function parseGetCapabilitiesTitle(
  url: string,
  format: OgcFormat,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const service = format.toUpperCase();
    const version = format === 'wms' ? '1.3.0' : format === 'wfs' ? '2.0.0' : '1.0.0';
    const separator = url.includes('?') ? '&' : '?';
    const capabilitiesUrl = `${url}${separator}service=${service}&request=GetCapabilities&version=${version}`;

    const res = await fetch(capabilitiesUrl, { signal });
    if (!res.ok) return null;
    const text = await res.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    if (xmlDoc.querySelector('parsererror')) return null;

    const title =
      xmlDoc.querySelector('Service > Title, ows\\:ServiceIdentification > ows\\:Title')
        ?.textContent?.trim() || null;
    return title || null;
  } catch {
    return null;
  }
}
