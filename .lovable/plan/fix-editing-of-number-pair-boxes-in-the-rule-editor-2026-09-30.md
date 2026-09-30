# Fix editing of number-pair boxes in the rule editor

## Problem

Boxes that hold a list of numbers (Pattern size, Pattern offset, Line dash and similar) rebuild their text from the saved numbers on every keystroke. Typing "5," is read back as just `5`, so the comma disappears straight away and you can never type the second number.

## Fix

- Each number-list box keeps what you have typed as-is, commas and spaces included, while you type.
- The saved numbers still update as you type, using whatever complete numbers are in the box (e.g. "8, " saves `[8]`, "8, 8" saves `[8, 8]`).
- When you click away, the box tidies itself to the standard "8, 8" form.
- If the value changes elsewhere (switching rules, the JSON editor, a recipe), the box shows the new value.

This one change covers every number-list box in the styling editor, because they all share the same input.

## Technical details

- `src/components/vectorStyle/ConstantInput.tsx`, `numberArray` branch: move it into a small `NumberArrayInput` component with local `text` state. `onChange` stores the raw text and sends the parsed array to the parent. A `useEffect` on `value` resyncs `text` only when the parsed current text no longer matches the incoming array, so typing isn't overwritten. `onBlur` normalises to `arr.join(', ')`.
- `src/components/vectorStyle/__tests__/ConstantInput.test.tsx`: add a test that typing "5," keeps the comma visible and sends `[5]`, and that "5, 5" sends `[5, 5]`.
- No changes to saved styles or config format.

## Verification

- `bunx vitest` and typecheck. Visual check left to you: edit Pattern size and a line dash on an existing rule.
