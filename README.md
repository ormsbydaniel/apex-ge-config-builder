# APEx Geospatial Explorer Configuration Builder

**Introduction**

This repository is the code for the Geospatial Explorer Configuration Builder, that is deployed to https://ge-config-builder.apex.esa.int/ and https://ge-config-builder.dev.apex.esa.int/

The repo hosted at https://github.com/ESA-APEx/ge_config_builder is a downstream mirror of a separate repo maintaned by Sparkgeo.  Any changes in the `main` or `dev` branches may get overwritten on the next synch.  Please make any changes in separate branches and liase with Sparkgeo to merge in to dev / main. 

**Synch repos**

* Execute **Actions -> Mirror to ESA-APEX** workflow in the upstream repo

This will synch the code and any release tags

**Deploy GE**

* Execution **Actions -> Build and Deploy** worklow in the https://github.com/ESA-APEx/ge_config_builder repo.  Select the target (dev or main) according to intent.
