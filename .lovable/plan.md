# Simplify STAC collection browsing

## Goal
Keep STAC collection browsing intuitive by removing collection-level add actions and ensuring every collection card fits within the modal without horizontal scrolling.

## Changes
- Remove the **Add collection** button from STAC collection cards; **Browse items** remains the sole collection action.
- Remove the now-unused collection-selection callback wiring between the STAC browser and service-selection modal, without removing direct `format: "stac"` data-source support elsewhere.
- Constrain collection rows and their content column to the modal width.
- Make long titles, descriptions, keywords, and other unbroken metadata wrap or truncate within the available content area while keeping **Browse items** fixed and always visible.
- Apply the same safe width constraints to static-catalog rows so unusually long collection links cannot cause equivalent overflow.

## Verification
- Open the ESA PRR STAC service and confirm collection cards require no horizontal scrolling and **Browse items** remains visible.
- Confirm long descriptions can still be expanded and collapsed without widening the modal.
- Confirm browsing a collection, selecting individual assets, and non-STAC service selection continue to work.
- Run focused tests/checks for the affected STAC browser and selection flow.