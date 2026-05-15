## Update `docs/configuration/interface-groups.md`

1. **Remove draft flag** — delete `status: draft` from front-matter.

2. **Intro panel** — mention sub-groups, and broaden the "must belong to one" line:

   > **Interface groups** are the top-level user-facing groupings shown in
   > the deployed APEx Geospatial Explorer's layer panel — for example
   > *Land Cover*, *Soils*, *Climate*. Each group can optionally contain
   > **sub-interface groups** for finer-grained organisation. Every layer
   > card in the config must belong to either an interface group or one of
   > its sub-groups.

3. **Rewrite "Sub-interface groups" section** — clarify that sub-groups are
   created via the **Add sub-group** button on each interface group, not by
   typing a name into the layer card:

   > Each interface group heading on the [Layers](../layers/index.md) tab
   > has an **Add sub-group** button that opens a dialog where you name
   > the new sub-group and pick which existing ungrouped layers to move
   > into it. Once created, layer cards can be dragged in or out of the
   > sub-group, and the sub-group will appear as a folder under its parent
   > interface group in the deployed Explorer.
   >
   > For the conceptual model see
   > [Layers overview → How the tab is laid out](../layers/index.md#how-the-tab-is-laid-out).

4. Rebuild the docs (`python3 -m mkdocs build --clean`).

No other files need changing.
