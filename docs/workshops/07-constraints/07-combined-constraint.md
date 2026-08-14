---
title: 7-7. Add a combined constraint
---
# 7-7. Add a combined constraint

## The principle

A **combined** constraint takes a continuous variable and groups it into named
bands — effectively making categories out of continuous data. The viewer
renders it as checkboxes rather than a slider, which is easier to use when the
meaningful divisions are known in advance: altitudinal zones, aspect classes,
uncertainty bands, or flood return periods.

We will add a second constraint on the **same** elevation COG used in
[7-5](05-continuous-constraint.md), this time as altitudinal zones.

## Configure it

1. **Add constraint** → **Direct URL** → paste the DSM again:

    ```
    https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/Copernicus_DSM_COG_10m_3857_fix.tif
    ```

2. Set:

    - **Label** — `Altitudinal zones`
    - **Interactive** — on
    - **Constraint Type** — **Combined**
    - **Units** — `meters`

3. Add four named ranges:

    | Label | Min | Max |
    | --- | --- | --- |
    | 0 to 1000 | 0 | 1000 |
    | 1001 to 2000 | 1001 | 2000 |
    | 2001 to 3000 | 2001 | 3000 |
    | > 3000 | 3001 | 4000 |

    !!! tip "Bulk Add"
        Rather than typing each range, select **Bulk Add**. Give a prefix, the
        number of ranges and the overall from/to values, check the preview, and
        the ranges are generated for you. Edit the labels afterwards if you want
        wording like "> 3000".

4. **Save** the constraint.

    !!! note
        **Populate from COG** is not available for combined constraints — the
        band boundaries are a design decision, not something that can be read
        from the file.

## View the result

In the **Preview** the layer now has both an **Elevation** slider and a set of
**Altitudinal zones** checkboxes. Untick *2001 to 3000* and *> 3000* to remove
the high alpine zones in one click, rather than dragging a slider handle to an
approximate position.

!!! warning "Two constraints, one source"
    Because both constraints read the same DSM they interact. If the Elevation
    slider is set to 0–1000 and only the *2001 to 3000* zone is ticked, nothing
    will render at all — there are no pixels that satisfy both.

### Did you remember to export?
