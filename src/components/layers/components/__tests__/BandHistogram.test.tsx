import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BandHistogram } from '../BandHistogram';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

describe('BandHistogram stretch buttons', () => {
  it('emphasises only the selected method and applies the clicked method', () => {
    const onFullRange = vi.fn();
    render(
      <BandHistogram
        data={[{ x: 1, count: 4 }, { x: 2, count: 5 }]}
        loading={false}
        channelColor="red"
        channelLabel="R"
        bandLabel="Band 3 – Red"
        dataMin={1}
        dataMax={2}
        min={1}
        max={2}
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        chartHeight={110}
        stretchOptions={[
          { id: 'percent-2-98', label: '2–98%', active: true, onApply: vi.fn() },
          { id: 'min-max', label: 'Full range', active: false, onApply: onFullRange },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: '2–98%' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Full range' })).toHaveAttribute('aria-pressed', 'false');
    const header = screen.getByText('Band 3 – Red').parentElement;
    expect(header).toContainElement(screen.getByRole('spinbutton', { name: 'Min' }));
    expect(header).toContainElement(screen.getByRole('button', { name: 'Full range' }));
    fireEvent.click(screen.getByRole('button', { name: 'Full range' }));
    expect(onFullRange).toHaveBeenCalledOnce();
  });
});