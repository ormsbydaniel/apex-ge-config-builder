

## Visually distinguish invalid service cards

Make failed services in the **Invalid services** section stand out at a glance, in addition to their existing amber error badge.

### Visual treatment

When a card is rendered as invalid (`validationStatuses[service.id] === 'error'`):

- **Left border**: switch the existing coloured left border (green/purple/blue by source type) to **red** (`border-l-destructive`) — same 4px width, so layout is unchanged.
- **Background tint**: add a very subtle red wash (`bg-destructive/5`) so the whole card reads as "needs attention" without shouting.
- **Full border**: add `border-destructive/30` so the right/top/bottom edges also pick up a faint red, framing the card.
- **Title colour**: keep the source-type colour (purple/green/blue) so users still recognise the service kind at a glance. Only the frame changes.
- **Icon, badges, buttons**: unchanged. The amber error badge + Retry button continue to do their job inside the card.

Valid cards remain exactly as they are today.

### Implementation

**Single file: `src/components/ServicesManager.tsx`** — modify `renderServiceCard` (line 654).

1. Compute `const isInvalid = validationStatuses[service.id] === 'error';` at the top of the helper.
2. Replace the current `<Card className="border-l-4 ...">` block so the className becomes:
   ```ts
   isInvalid
     ? 'border-l-4 border-l-destructive border-destructive/30 bg-destructive/5'
     : `border-l-4 ${sourceTypeBorderClass}` // existing green/purple/blue logic
   ```
3. No other changes — title colour, icon, badges, action buttons, and the partition logic all stay intact.

### Out of scope

- Changing the amber "validation error" badge styling.
- Animations / pulse effects on invalid cards.
- Applying the treatment to `checking` or `idle` states.

