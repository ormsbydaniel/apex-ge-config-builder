import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('uses move buttons outside each rule card instead of drag handles', () => {
    renderEditor([rule('First'), rule('Second')]);

    expect(screen.getAllByRole('button', { name: 'Move rule up, double-click to move to top' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Move rule down, double-click to move to bottom' })).toHaveLength(2);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Move rule up, double-click to move to top' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Move rule down, double-click to move to bottom' })[1]).toBeDisabled();
  });

  it('moves a rule one position on a single arrow click', () => {
    vi.useFakeTimers();
    const { onChange } = renderEditor([rule('First'), rule('Second'), rule('Third')]);

    fireEvent.click(screen.getAllByRole('button', { name: 'Move rule down, double-click to move to bottom' })[0]);
    vi.advanceTimersByTime(250);

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Second' }),
      expect.objectContaining({ name: 'First' }),
      expect.objectContaining({ name: 'Third' }),
    ]);
  });

  it('moves a rule to the end on an arrow double-click', () => {
    vi.useFakeTimers();
    const { onChange } = renderEditor([rule('First'), rule('Second'), rule('Third')]);

    fireEvent.doubleClick(screen.getAllByRole('button', { name: 'Move rule down, double-click to move to bottom' })[0]);
    vi.runAllTimers();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Second' }),
      expect.objectContaining({ name: 'Third' }),
      expect.objectContaining({ name: 'First' }),
    ]);
  });

  it('adds blank rules and duplicates at the top', () => {
    const blank = renderEditor([rule('First'), rule('Second')]).onChange;
    fireEvent.click(screen.getByRole('button', { name: /Start from scratch/i }));
    expect(blank).toHaveBeenCalledWith([
      expect.objectContaining({ primitives: {} }),
      expect.objectContaining({ name: 'First' }),
      expect.objectContaining({ name: 'Second' }),
    ]);

    const duplicate = vi.fn();
    renderEditor([rule('First'), rule('Second')], duplicate);
    fireEvent.click(screen.getAllByRole('button', { name: 'Duplicate rule' })[3]);
    expect(duplicate).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Second copy' }),
      expect.objectContaining({ name: 'First' }),
      expect.objectContaining({ name: 'Second' }),
    ]);
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