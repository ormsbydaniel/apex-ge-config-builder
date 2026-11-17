import { describe, expect, it } from 'vitest';
import { hasRealmRole, PUBLISHER_ROLE } from '@/auth/roles';

describe('hasRealmRole', () => {
  it('reads realm roles from a token', () => {
    const token = { realm_access: { roles: [PUBLISHER_ROLE, 'user'] } };
    expect(hasRealmRole(token, PUBLISHER_ROLE)).toBe(true);
    expect(hasRealmRole(token, 'missing')).toBe(false);
    expect(hasRealmRole(null, PUBLISHER_ROLE)).toBe(false);
    expect(hasRealmRole({}, PUBLISHER_ROLE)).toBe(false);
  });
});
