/**
 * Realm roles shared by the config builder, the Geospatial Explorer and the
 * future publishing API. The API is the only place a role grants permission.
 * The apps use this helper to show or hide controls.
 *
 * `publisher` is reserved for publishing. No screen checks it yet.
 */
export interface TokenWithRealmRoles {
  realm_access?: { roles?: string[] };
}

export function hasRealmRole(
  tokenParsed: TokenWithRealmRoles | null | undefined,
  role: string,
): boolean {
  const roles = tokenParsed?.realm_access?.roles;
  return Array.isArray(roles) && roles.includes(role);
}

/** Role the future publishing API will require. Not enforced in the UI yet. */
export const PUBLISHER_ROLE = 'publisher';
