import { describe, expect, it } from 'vitest';
import { bboxValuesToBounds, cornersToBboxValues } from '@/utils/stacBboxMap';

describe('stacBboxMap helpers', () => {
  it('orders corners from a right-to-left drag, rounds and clamps', () => {
    expect(cornersToBboxValues({ lat: 52.123456, lng: -1.3 }, { lat: 51.3, lng: -3.000049 })).toEqual(['-3', '51.3', '-1.3', '52.1235']);
    expect(cornersToBboxValues({ lat: -95, lng: -200 }, { lat: 95, lng: 200 })).toEqual(['-180', '-90', '180', '90']);
  });
  it('parses complete values only', () => {
    expect(bboxValuesToBounds(['-3', '51', '-1', '52'])).toEqual([-3, 51, -1, 52]);
    expect(bboxValuesToBounds(['', '51', '-1', '52'])).toBeNull();
    expect(bboxValuesToBounds(['1', '51', '-1', '52'])).toBeNull();
  });
});
