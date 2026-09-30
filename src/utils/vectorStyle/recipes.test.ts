
import { sampleRamp as _sampleRamp, assignCategoricalColors as _assignCat } from './palettes';
describe('reverse palette', () => {
  it('reverses ramp colours', () => {
    const a = _sampleRamp(5, 'viridis');
    expect(_sampleRamp(5, 'viridis', true)).toEqual([...a].reverse());
  });
  it('reverses categorical assignment order', () => {
    const a = _assignCat(10, 'tableau10');
    expect(_assignCat(10, 'tableau10', true)[0]).toBe(a[9]);
  });
});
