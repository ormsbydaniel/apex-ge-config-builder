import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StacDateRangePicker from '../StacDateRangePicker';

describe('STAC independent date pickers', () => {
  it('changes a start date across years without changing the end', () => {
    const onChange = vi.fn();
    render(<StacDateRangePicker start="2022-01-10T00:00" end="2025-06-20T23:59" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start date' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Year:' }), { target: { value: '2023' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Month:' }), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('gridcell', { name: '15', exact: true }));
    expect(onChange).toHaveBeenCalledWith('2023-03-15T00:00', '2025-06-20T23:59');
  });

  it('opens the end calendar at its own date and preserves the start', () => {
    const onChange = vi.fn();
    render(<StacDateRangePicker start="2022-01-10T00:00" end="2025-06-20T23:59" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'End date' }));
    expect(screen.getByRole('combobox', { name: 'Year:' })).toHaveValue('2025');
    expect(screen.getByRole('combobox', { name: 'Month:' })).toHaveValue('5');
    fireEvent.click(screen.getByRole('gridcell', { name: '18', exact: true }));
    expect(onChange).toHaveBeenCalledWith('2022-01-10T00:00', '2025-06-18T23:59');
  });

  it('preserves open endpoints and optional time editing', () => {
    const onChange = vi.fn();
    render(<StacDateRangePicker start="2022-01-10T08:30" end="2025-06-20T23:59" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '09:45' } });
    expect(onChange).toHaveBeenLastCalledWith('2022-01-10T09:45', '2025-06-20T23:59');
    fireEvent.click(screen.getAllByRole('button', { name: 'Make open-ended' })[0]);
    expect(onChange).toHaveBeenLastCalledWith('', '2025-06-20T23:59');
  });
});