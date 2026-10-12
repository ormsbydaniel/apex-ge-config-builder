# Tutorial 10-6: Customising vector field values

## Target (from `tutorial-10-prerequisites_20261012_0832.json`, Oslo Downscaled Surface NO2)

| Field | Result |
|---|---|
| `date` | Label **Observation date** |
| `no2_ugm3` | Label **Nitrogen Dioxide**, suffix `ug / m3`, precision 2 |
| `uncertainty_ugm3` | Label **Uncertainty**, suffix `ug / m3`, precision 2 |
| `city`, `product`, `datetime_utc`, `source_datetime`, `obs_index` | Hidden |

Display order: date, Nitrogen Dioxide, Uncertainty.

## Exercise outline (`docs/workshops/10-vector-data/06-customising-field-values.md`)

1. **Look at the raw values first** — Preview, switch on the Oslo layer, zoom to it, open **Data Values**, click a cell. Note raw property names (`no2_ugm3`), full-precision numbers, and internal fields (`obs_index`, `product`, etc.).
2. **Open Manage Fields** on the Oslo layer card and use **Populate field details** (explain it reads properties from the first file; all dated files share the same fields).
3. **Rename** `date`, `no2_ugm3`, `uncertainty_ugm3`.
4. **Add units and precision** — suffix `ug / m3`, precision 2 on both concentration fields.
5. **Hide** the five housekeeping fields (note hidden fields stay in the config as `null`).
6. **Order** rows: date, Nitrogen Dioxide, Uncertainty (up/down chevrons or drag).
7. Save, Preview again, click the same cell and compare before/after.
8. Optional: show the resulting `meta.fields` JSON via the JSON editor so learners can check against the target.
9. "Did you remember to export?" ending, matching 10-3 to 10-5.

## Screenshots (captured from the prerequisite config with fields cleared in the capture copy)

- `tutorial-10-06-data-values-raw.png` — Data Values panel before.
- `tutorial-10-06-manage-fields-button.png` — Manage Fields in context on the layer card.
- `tutorial-10-06-manage-fields-configured.png` — editor in the target state.
- `tutorial-10-06-data-values-customised.png` — Data Values panel after.

Dual-copied to `docs/assets/screenshots/` and `public/guide/assets/screenshots/`, widths by aspect ratio as before.

## Other updates

- Tutorial 10 `index.md`: add 10-6 to the step list and an objective bullet.
- `mkdocs.yml`: register 10-6 (`nav-groups.js` already has the Tutorial 10 entry; check it needs nothing more).
- Link to `docs/layers/data-values-vector.md` for the full option reference.
- `roadmap.md` entry; strict docs rebuild. Not published.

## Note

The exercise assumes field values have been cleared from the prerequisite file. Until you do that, learners loading the current file will already see the finished result.
