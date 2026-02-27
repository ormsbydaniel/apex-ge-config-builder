

## Change Default Page Size to 5 and Add Page Size Selector

### Changes — `src/components/layers/components/DataSourceDisplay.tsx`

1. Change `ITEMS_PER_PAGE` from a constant to state: `const [itemsPerPage, setItemsPerPage] = useState(5)`
2. Replace all references to `ITEMS_PER_PAGE` with `itemsPerPage`
3. Reset `currentPage` to 0 when `itemsPerPage` changes (add to existing `useEffect` deps)
4. Add a `<Select>` dropdown next to the "Showing X–Y of Z" text with options: 5, 10, 25, 50
5. On select change, update `itemsPerPage` and reset page to 0

