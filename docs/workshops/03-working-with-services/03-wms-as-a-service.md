---
title: 3-3. Adding WMS as a service
---
# 3-3. Adding WMS as a service

In tutorial 2 you added a WMS layer using a **direct connection** — the service
URL and layer name were typed straight into the layer card. In this step we will
register the same endpoint as a **service**, so that its capabilities are read
once and its layers can be browsed whenever you add a dataset.

1. On the **Services** tab, select **Add Service** (top right). Leave **Service Type** set to **WMS** and paste the following into the **Service URL**:

    ```
    https://mapproxy.terrascope.be/mapproxy/service
    ```

2. Wait for the validation message. When the endpoint responds you will see a
   green **Reachable** status, and the **Service Name** is auto-populated from
   the service's `GetCapabilities` response. You can override the name if you
   prefer something shorter, e.g. `Terrascope WMS`.
3. Select **Add Service**. The service now appears in the **Configured
   Services** list, with a badge showing the number of layers discovered and the
   WMS version reported by the service.

## Use the service in a layer card

1. Return to the **Layers** tab and add a new layer card called `World Cover
   2020` in your `Land cover` interface group.
2. Select **+ Add dataset → From service** and pick the WMS service you just added. The builder loads the capabilities and
   presents a searchable list of layers.
3. Search for `worldcover`. Multiple years will appear in the search results,
    including layers named **WORLDCOVER MAP**; select the **2020** version,
    then choose **Select** then **Add source** to complete the step.
4. *Preview* your config now to see the new layer, then select *Export* so you
   don't lose your work.

!!! tip "Direct connection vs service"

    Use a **direct connection** for a one-off layer where you already know the
    layer name. Register a **service** when you expect to pull several layers
    from the same endpoint, or when you want to browse what is available.

See [Adding services](../../services/adding-services.md) and
[WMS / WMTS / WFS](../../data-sources/wms-wmts-wfs.md) for the full reference.
