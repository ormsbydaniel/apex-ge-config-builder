import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StyleEditor from '../StyleEditor';
import type { StyleRule } from '@/types/vectorStyle';

const rule = (name: string): StyleRule => ({ name, enabled: true, primitives: {} });

const renderEditor = (rules: StyleRule[], onChange = vi.fn(), onRulesEmpty = vi.fn()) => {
  render(
    <StyleEditor
      rules={rules}
      onChange={onChange}
      fields={[]}
      onPickRecipe={vi.fn()}
      onRulesEmpty={onRulesEmpty}
    />,
  );
  return { onChange, onRulesEmpty };
};

describe('StyleEditor rule list', () => {
  it('returns to the recipe gallery after deleting the final rule', () => {
    const { onChange, onRulesEmpty } = renderEditor([rule('Only rule')]);

    fireEvent.click(screen.getByRole('button', { name: 'Delete rule' }));

    expect(onChange).toHaveBeenCalledWith([]);
    expect(onRulesEmpty).toHaveBeenCalledOnce();
  });

  it('keeps the editor open after deleting one of several rules', () => {
    const { onChange, onRulesEmpty } = renderEditor([rule('First'), rule('Second')]);

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete rule' })[0]);

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'Second' })]);
    expect(onRulesEmpty).not.toHaveBeenCalled();
  });

  it('uses drag handles without additional move buttons', () => {
    renderEditor([rule('First'), rule('Second')]);

    expect(screen.queryByRole('button', { name: 'Move rule up' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move rule down' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    // Only the grip handle drags, not the whole card.
    expect(screen.getAllByRole('listitem')[0]).not.toHaveAttribute('draggable');
    expect(screen.getAllByLabelText('Drag to reorder')[0]).toHaveAttribute('draggable', 'true');
  });

  it('selects the rule the focusRule prop points at after a recipe append', () => {
    const base = { onChange: vi.fn(), fields: [], onPickRecipe: vi.fn(), onRulesEmpty: vi.fn() };
    const { rerender } = render(<StyleEditor rules={[rule('First')]} {...base} />);

    // A recipe appended a second rule; the dialog asks the editor to focus it.
    rerender(
      <StyleEditor
        rules={[rule('First'), rule('Second')]}
        {...base}
        focusRule={{ index: 1, nonce: 1 }}
      />,
    );

    // The editor pane shows the newly appended rule, not the top one.
    expect(screen.getByDisplayValue('Second')).toBeInTheDocument();
  });
});