import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import IndexStopsEditor from '../IndexStopsEditor';

const stops = [
  { value: -0.5, color: '#112233', meaning: 'Low' },
  { value: 0.5, color: '#AABBCC', meaning: 'High' },
];

describe('IndexStopsEditor', () => {
  it('edits values, colours, and legend meanings', () => {
    const onChange = vi.fn();
    render(<IndexStopsEditor stops={stops} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Stop 1 legend meaning'), { target: { value: 'Very low' } });
    expect(onChange).toHaveBeenLastCalledWith([{ ...stops[0], meaning: 'Very low' }, stops[1]]);

    fireEvent.change(screen.getByLabelText('Stop 2 value'), { target: { value: '0.8' } });
    expect(onChange).toHaveBeenLastCalledWith([stops[0], { ...stops[1], value: 0.8 }]);
  });

  it('keeps the minimum two stops', () => {
    render(<IndexStopsEditor stops={stops} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /Remove stop/ })).toEqual(
      expect.arrayContaining([expect.objectContaining({ disabled: true })]),
    );
  });
});