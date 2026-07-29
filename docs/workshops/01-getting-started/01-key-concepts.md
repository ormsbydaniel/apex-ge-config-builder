---
title: 1. Key concepts
---
# Key concepts

Before you start clicking around, it is worth knowing a few things about the
Config Builder and how it fits into the wider Geospatial Explorer stack.

- The **Geospatial Explorer Configuration Builder** ("CB") is an authoring
  tool for the JSON files that drive the Geospatial Explorer ("GE").
- The JSON is complex. The CB exists to reduce the technical barrier for
  building GE configurations by hand.
- The CB runs **entirely in your browser**. There is no backend, no login and
  no server-side storage of your work.
- You "save" your configuration by **exporting** it to your local machine as a
  JSON file, and reload it later by importing that file back into the CB.
- Configurations are shareable — email or Slack the exported JSON to a
  collaborator and they can load it into their own browser.
- A run-time version of the GE is **integrated into the CB** on the **GE Preview**
  tab. Both released versions and interim development versions of the GE are
  available, so you can build configurations that target features not yet in a
  stable release.
- The CB itself is a work in progress. Feedback and suggestions based on your
  own experience are welcome.

!!! info "No cloud storage"
    Because everything is browser-side, closing your browser tab loses your
    work unless you have exported it. Get into the habit of exporting after
    every meaningful change.
