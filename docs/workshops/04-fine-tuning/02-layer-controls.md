---
title: 4-2. Experiment with layer controls
---
# 4-2. Experiment with layer controls

The **Layer controls** section of a layer card decides which interactive
controls the Explorer shows for that layer. Open your *AGB* layer card, find
the **Controls** section, and click the pencil icon to open **Edit Controls**.

After each change, **Save** the layer card and open **GE Preview** to see the
effect in the Explorer.

### Toggleable

Lets users switch the layer on and off from its card in the Explorer.

1. Tick **Toggleable** and **Save**.
2. Open **GE Preview** and switch the layer off, then on again.

### Zoom to Center

Adds a zoom button that moves the map to the layer. There are two options for
where it zooms to.

**Layer bounds** — zooms to the extent of the data itself.

1. Tick **Zoom to Center** and choose **Layer bounds**.
2. **Save**, then open **GE Preview**.
3. Pan and zoom the map somewhere else, then click the layer's zoom button.

**Custom extent** — zooms to coordinates you supply, useful when you want to
land on a particular region rather than the whole dataset.

1. Re-open **Edit Controls** and switch to **Custom extent**.
2. Enter an extent as `xmin, ymin, xmax, ymax`, for example:

    ```
    -10, 35, 30, 60
    ```

3. **Save**, preview again, and compare the result with the layer bounds
   behaviour.

!!! note
    If the extent is incomplete or not four valid numbers, the control falls
    back to zooming to the layer bounds.

### Opacity Slider

Lets users fade the layer so they can see what is underneath it.

1. Tick **Opacity Slider** and **Save**.
2. In **GE Preview**, drag the slider and watch the base map show through.

### Blend Controls

Exposes blend modes (multiply, overlay, and so on) that change how the layer
combines with the layers below it.

1. Tick **Blend Controls** and **Save**.
2. In **GE Preview**, try a couple of blend modes over your base map.

### Constraint Slider

Surfaces a slider for filtering the layer by a configured constraint — for
example only showing values above a threshold.

1. Tick **Constraint Slider** and **Save**.

!!! info "Constraints come later"
    This control only does something once constraints are defined on the
    layer. We cover that in [Tutorial 7 — Constraints](../07-constraints/index.md).

### Temporal Controls

Shows the time picker for layers that have timestamps. The **Time picker**
dropdown (None, Time, Days, Months, Years) sets the granularity presented to
the user.

Leave this one alone for now — we come back to it in
[Tutorial 6 — Time series](../06-time-series/index.md).

### Download

Adds a download button to the layer card. The optional URL field controls
where that button points.

1. Tick **Download** and **Save**.
2. Preview and check the download button appears on the layer card.

!!! tip "Download links"
    You can either paste the COG URL from the earlier tutorial (which triggers
    a direct download) or a link to somewhere more useful — for example the
    dataset's STAC record on the PRR.

### Did you remember to export?

If not, now is a good moment. See [Exporting and reloading
config](../02-getting-started/04-export-and-reload.md).
