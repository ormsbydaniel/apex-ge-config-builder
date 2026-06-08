import { describe, it, expect } from 'vitest';
import { fromFlatStyleArray } from '@/utils/vectorStyle/fromFlatStyleArray';
import { summariseRules } from '@/utils/vectorStyle/summariseStyleRule';

describe('VectorStyleSummary flat-style integration', () => {
  it('summarises a simple stroke-only flat rule as a line swatch', () => {
    const flat = [{ 'stroke-color': '#3b82f6', 'stroke-width': 2 }];
    const parsed = fromFlatStyleArray(flat);
    const summaries = summariseRules(parsed.rules);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].dominantKind).toBe('line');
    expect(summaries[0].colour).toBe('#3b82f6');
    expect(summaries[0].primitiveKinds).toContain('line');
  });
});
