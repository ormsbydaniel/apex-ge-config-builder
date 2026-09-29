# Consolidate steps in tutorial 8-6

## Outcome
Tutorial 8-6 (Understanding the statistics files) goes from 8 numbered steps to 6, grouping same-screen actions into single tasks while keeping the Preview checkpoint and the inspection moment as their own steps. Lesson content, URLs, screenshot and tips are unchanged.

## Changes to `docs/workshops/08-statistics/06-panel-and-controls.md`

- **Keep step 1** (add a new layer named `Temp`) — a distinct setup task.
- **Combine steps 2–4** into one "add the data source" task: on the `Temp` layer card, open **Data Sources**, stay on the **Data** tab, click **Add source**, choose **Direct** connection and **FlatGeoBuf**, and enter the NUTS level 0 URL. The URL stays as its own indented code block under the step (four-space indentation, blank line before it, per the MkDocs nested-content rule).
- **Keep step 5** (save the source, open the **Preview**, turn `Temp` on) — a verification checkpoint crossing into the Preview.
- **Combine steps 6–7** into one inspection task: select the **Data Values** tab, click a country, and look at what is listed — descriptive fields alongside the pre-computed class areas, which is exactly what the **Statistics** tab reads. The existing explanation paragraph and the Data Values screenshot stay with this step (screenshot indented four spaces so it renders inside the step).
- **Keep step 8** (delete the `Temp` layer) — a distinct cleanup action.

The closing "Building your own statistics files" tip and the export reminder are untouched.

## Technical checks
- Four-space indentation for the code block, continuation text and screenshot under numbered steps; blank line before nested content.
- Rebuild with `python3 -m mkdocs build --strict` and verify the rendered page shows 6 numbered steps with the code block and screenshot nested correctly. Do not publish.
