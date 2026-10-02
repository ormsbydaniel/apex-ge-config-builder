import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CompositeGallery from '../CompositeGallery';

describe('CompositeGallery', () => {
  it('shows only composite cards until the Indices tab is chosen', () => {
    const onTabChange = vi.fn();
    const onPick = vi.fn();
    const { rerender } = render(
      <CompositeGallery bandCount={10} loading={false} activeTab="rgb" onTabChange={onTabChange} onPick={onPick} onPickIndex={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /Natural colour/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Vegetation \(NDVI\)/ })).not.toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('tab', { name: 'Indices' }), { button: 0, ctrlKey: false });
    expect(onTabChange).toHaveBeenCalledWith('index');

    rerender(
      <CompositeGallery bandCount={10} loading={false} activeTab="index" onTabChange={onTabChange} onPick={onPick} onPickIndex={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /Vegetation \(NDVI\)/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Natural colour/ })).not.toBeInTheDocument();
    expect(onPick).not.toHaveBeenCalled();
  });
});