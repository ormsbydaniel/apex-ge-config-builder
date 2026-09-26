import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ConstantInput from '../ConstantInput';

describe('vector style colour preview', () => {
  it('previews RGBA stop colours while retaining their original value', () => {
    const html = renderToStaticMarkup(
      <ConstantInput type="color" value="rgba(119, 116, 181, 0.8)" onChange={() => {}} />,
    );
    expect(html).toContain('type="color"');
    expect(html).toContain('value="#7774B5"');
    expect(html).toContain('value="rgba(119, 116, 181, 0.8)"');
  });

  it('continues to preview hex colours', () => {
    const html = renderToStaticMarkup(
      <ConstantInput type="color" value="#c9e6c2" onChange={() => {}} />,
    );
    expect(html).toContain('value="#C9E6C2"');
  });
});