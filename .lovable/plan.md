# Fix clipped contrast focus and histogram Min handle

## Change
- Give the contrast dropdown enough inset inside the right-hand scrolling panel for its focus outline to remain visible on every side, without changing the shared dropdown styling or widening the control.
- Keep each histogram’s draggable Min/Max grip and label fully inside the plot at the data-range endpoints. Preserve the displayed range, handle values, and dragging behaviour; check Red, Green, and Blue independently.

## Verification
- Use the multispectral test configuration to inspect the contrast dropdown focused and the three histogram handles when Min is at the left edge, including a narrow editor width.
- Run the focused histogram tests and check the preview for errors. Leave broader UI testing to you.

## Technical notes
The dropdown uses the shared focus ring inside a clipped scrolling area. Histogram handles currently centre themselves on 0%/100% with a negative half-width offset, and their labels centre there too; endpoint labels can extend beyond the chart. Keep the fix local to the multi-band editor and histogram component.
