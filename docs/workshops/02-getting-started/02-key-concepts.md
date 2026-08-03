---
title: 2-2. Key concepts
---
# 2-2. Key concepts

Before get into the details, it is worth knowing a few things about the
Config Builder and how it fits into the wider Geospatial Explorer stack.

- The **Geospatial Explorer Configuration Builder** ("CB") is an authoring
  tool for the JSON files that deterimine what a Geospatial Explorer ("GE") shows and does when deployed.
- The JSON is complex. The CB exists to reduce the technical barrier for
  building GE configurations by hand.
- The CB runs **entirely in your browser**. There is no backend, no login and
  no server-side storage of your work.
- You "save" your configuration by **exporting** it to your local machine as a
  JSON file, and reload it later by importing that file back into the CB.
- Configurations are shareable — email or Slack the exported JSON to a
  collaborator and they can load it into their own browser using the CB.
- A run-time version of the GE is **integrated into the CB** on the **GE Preview**
  tab. Both released versions and interim development versions of the GE are
  available, so you can build configurations that target features not yet in a
  stable release.
- The deployment of a completed configuration involves posting it to a location where it is picked up by a GE deployment.  For APEx hosted GE instances, most GE instances read their configurations from a config.json file deployed in the https://github.com/ESA-APEx/apex_geospatial_explorer_configs/ repository.

!!! warning "No cloud storage"
    Because everything is browser-side, closing your browser tab loses your
    work unless you have exported it. Get into the habit of exporting after
    every meaningful change.
