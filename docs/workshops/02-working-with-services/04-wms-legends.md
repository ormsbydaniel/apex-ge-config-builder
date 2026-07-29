---
title: 13. Add legends for a WMS
---
# Add legends for a WMS

Some WMS services expose a legend graphic via `GetLegendGraphic`. When they do,
the CB can pull that legend straight into your layer card.

1. On the dataset row of a WMS layer, select the **(i)** info icon. The
   metadata dialog shows whether the WMS reports a legend graphic.
2. If a legend graphic is available, select **Copy to config**. The legend is
   attached to the layer card.
3. If no legend graphic is available, edit the layer card and point the
   **Legend image URL** at any publicly accessible PNG — for example a legend
   you've curated yourself.

Preview the layer to check the legend renders where you expect it in the
Explorer's info panel.



!!! tip "Curate your legends"
    A WMS legend that comes straight from the server is often visually noisy or
    inconsistent with the rest of your configuration. Overwriting it with a
    hand-crafted PNG is often a good idea.

### Did you remember to export?

If not, now is a good moment.
