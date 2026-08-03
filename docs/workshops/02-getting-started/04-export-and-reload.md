---
title: 2-4. Exporting and reloading config
---
# 2-4. Exporting and reloading config

!!! warning "IMPORTANT"
    There is **no save button** in the Configuration Builder, because the config is just held in memory in your web browser.  However the config can be **exported** so you can save it locally on your machine. 

1. On the **Home** tab, select **Export → Quick Export**. A file called
   `config_YYYYMMDD_HHMM.json` will download to your local machine in wherever your default **Downloads** folder lives.  
2. Select **New Config**. Your current config will be replaced with an emoty configuration.
3. Select **Load Config** and pick the `config_XX.json` you just downloaded. Your
   previous configuration is restored.

!!! tip "Export frequently"
    As you continue through this tutorial series, export your config after every
    couple of steps in a tutorial.  As config files are exported wiht a unituq date and time suffix, your Downloads folder will start to build up, but the files are only small and the datestamps allow you to backtrack to previous versions if you need to.

4. OPTIONAL:  You can also make a custom name for your config files, which is really useful if you are working on several different configs.  Go to **Settings** and change the *Export filename prefix* from *config* to a name of your choice.

See [Loading and saving](../../getting-started/loading-saving.md) and
[Export options](../../configuration/export-options.md) for the full options,
including sorting exported JSON to match the UI order.
