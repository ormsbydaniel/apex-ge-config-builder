---
title: 9-6. Other indices
---

# 9-6. Other indices

Now you know how to style one index, try some of the others. For each one, follow the same steps as in 9-4 and 9-5:

1. **Duplicate** one of your Bristol Sentinel 2 layers.
2. **Rename** the copy to something meaningful, e.g. _Bristol Sentinel 2 NDVI_.
3. **Clear** the multi-band visualisation with the **red trash can**, then click the **pencil** to choose a new one from the **Indices** tab.
4. **Save**, then **Preview** and compare it with your other layers. Try the **range presets** too.

## Suggested indices to try

| Index | Bands used | What to look for around Bristol |
| --- | --- | --- |
| **Vegetation (NDVI)** | NIR, Red | Fields, woodland such as **Leigh Woods** and parks show green; urban areas and water show low values. |
| **Modified water (MNDWI)** | Green, SWIR1 | Compare with your NDWI layer — water in the docks and **Floating Harbour** should be clearer, with fewer false positives from buildings. |
| **Built-up (NDBI)** | SWIR1, NIR | The city centre, **Avonmouth** docks and industrial estates show red. |
| **Red edge (NDRE)** | NIR, Red edge | Similar to NDVI but more sensitive in dense vegetation; compare the two over farmland. |
| **Burn ratio (NBR)** | NIR, SWIR2 | Mainly used for fire scars, so there is little to see here — a useful reminder that each index answers a specific question. |

!!! info "Choosing an index"
    There are many more indices than are listed here. Before using one, check that it fits the question you are asking, and that your dataset has the bands it needs. If an index needs a band your data does not have, it cannot be calculated.

## Optional: compare indices

If you added your layers to the **bristol-s2** exclusivity set in 9-4, switching one on in the **Preview** will turn the others off. Use this to flick between, for example, **NDVI**, **NDWI** and **NDBI** and see how vegetation, water and built-up areas complement each other.

### Did you remember to export?
