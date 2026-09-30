import { describe, expect, it } from 'vitest';
import { assignFieldOrder, orderedFieldNames } from '../fieldOrder';

describe('field display order', () => {
  const fields = {
    alpha: { label: 'Alpha', order: 20, format: 'yyyy-MM-dd', type: 'date' },
    hidden: null,
    beta: { label: 'Beta', order: 3 },
    gamma: { suffix: ' km' },
  };

  it('loads explicit order before unordered fields without relying on key order', () => {
    expect(orderedFieldNames(fields)).toEqual(['beta', 'alpha', 'hidden', 'gamma']);
  });

  it('writes visible order from row positions and leaves hidden fields null', () => {
    const reordered = assignFieldOrder(fields, ['gamma', 'hidden', 'alpha', 'beta']);
    expect(reordered).toEqual({
      gamma: { suffix: ' km', order: 1 },
      hidden: null,
      alpha: { label: 'Alpha', order: 2, format: 'yyyy-MM-dd', type: 'date' },
      beta: { label: 'Beta', order: 3 },
    });
    expect(orderedFieldNames(reordered).filter(name => reordered[name] !== null)).toEqual(['gamma', 'alpha', 'beta']);
  });
});