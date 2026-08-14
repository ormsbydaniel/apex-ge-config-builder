---
title: 2-4. Exporting and reloading config
---
# 2-4. Exporting and reloading config

!!! warning "IMPORTANT"
    There is **no save button** in the Configuration Builder, because the config is only held in memory in your web browser. However, the config can be **exported** so you can save it locally on your machine.

1. Export your config using either route:

    - The **Export** button at the top right of the builder, or
    - **Home → Export → Quick Export**

    ![Export button at the top right of the Configuration Builder](../../assets/screenshots/home-export-button-top.png)

    A file called `config_YYYYMMDD_HHMM.json` will download to your machine, into whichever folder is set as your default **Downloads** location.

2. Select **New Config**. Your current config will be replaced with an empty configuration.
3. Select **Load Config** and pick the `config_XX.json` you just downloaded. Your previous configuration is restored.

4. OPTIONAL: You can also set a custom name for your config files, which is really useful if you are working on several different configs. Go to **Settings** and change the *Export filename prefix* from *config* to a name of your choice.

!!! tip "Export frequently"
    As you continue through this tutorial series, export your config after every couple of steps. Config files are exported with a unique date and time suffix, so your Downloads folder will build up — but the files are small, and the datestamps allow you to backtrack to previous versions if you need to.

See [Loading and saving](../../getting-started/loading-saving.md) and
[Export options](../../configuration/export-options.md) for the full options,
including sorting exported JSON to match the UI order.
