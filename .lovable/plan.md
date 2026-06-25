## Add "Storymaps" tab

Insert a new tab between Algorithms and Services in the main `ConfigBuilder` tab bar, showing a coming-soon placeholder.

### Changes

1. **`src/components/config/StorymapsTab.tsx`** (new) — simple centred card:
   - Heading: "Storymaps"
   - Body: "Story map functionality is coming soon to the Geospatial Explorer. Watch this space!"
   - Uses the same `Card` / muted-text styling as other empty-state panels in the app.

2. **`src/components/ConfigBuilder.tsx`**:
   - Import `StorymapsTab` and an appropriate icon (e.g. `BookOpen`, already imported).
   - Add a `<TabsTrigger value="storymaps">` between the Algorithms and Services triggers.
   - Add a matching `<TabsContent value="storymaps"><StorymapsTab /></TabsContent>`.

No schema, context, or config changes — purely presentational placeholder.