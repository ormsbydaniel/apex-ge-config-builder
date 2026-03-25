

## Enhance Vector Styling Dialog with Tabs and Wrapped JSON

### Changes — `src/components/layers/components/VectorStylingDialog.tsx`

**1. Wrap JSON in `"style": [...]` envelope**
- Change `initialJson` to output `{ "style": [...] }` instead of just the array
- On save, parse the full object, extract `.style`, validate it's an array, then apply as before

**2. Add tabbed interface**
- Import `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`
- Two tabs: **Basic Styling** and **JSON Style Editor**
- "Basic Styling" tab shows a placeholder message: *"Marker, line, fill and label styling coming soon"* in muted text
- "JSON Style Editor" tab contains the existing Monaco editor and description text

**3. Remember last-used tab across opens (session-level)**
- Use a module-level `let` variable (outside the component) to store the last selected tab value
- Initialize `Tabs` `defaultValue` from this variable; update it via `onValueChange`
- This persists across dialog open/close within the same browser session without needing context or localStorage

### Files modified
1. `src/components/layers/components/VectorStylingDialog.tsx`

