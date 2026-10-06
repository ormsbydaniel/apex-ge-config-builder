import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CompositeGallery from '../CompositeGallery';
import { paletteGradient, recipePalette } from '@/utils/rgbComposite/indices';

describe('CompositeGallery', () => {
  it('shows only composite cards until the Indices tab is chosen', () => {
    const onTabChange = vi.fn();
    const onPick = vi.fn();
    const { rerender } = render(
      <CompositeGallery bandCount={10} loading={false} activeTab="rgb" onTabChange={onTabChange} onPick={onPick} onPickIndex={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /Natural colour/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Vegetation \(NDVI\)/ })).not.toBeInTheDocument();
    rerender(
      <CompositeGallery bandCount={10} loading={false} activeTab="index" onTabChange={onTabChange} onPick={onPick} onPickIndex={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /Vegetation \(NDVI\)/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Natural colour/ })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Indices' })).toHaveAttribute('data-state', 'active');
    expect(onPick).not.toHaveBeenCalled();
  });

  it('shows each supplied index palette on its recipe card', () => {
    render(
      <CompositeGallery bandCount={10} loading={false} activeTab="index" onTabChange={vi.fn()} onPick={vi.fn()} onPickIndex={vi.fn()} />,
    );

    for (const id of ['ndvi', 'ndwi', 'mndwi', 'ndbi', 'nbr', 'ndre'] as const) {
      const palette = recipePalette(id);
      expect(palette).toBeDefined();
      expect(screen.getByTestId(`index-gradient-${id}`)).toHaveStyle({
        background: paletteGradient(palette?.stops ?? []),
      });
    }
    expect(screen.queryByTestId('index-gradient-custom-index')).not.toBeInTheDocument();
  });
});