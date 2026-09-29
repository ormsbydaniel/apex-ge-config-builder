# Add Tutorial 9: Coordinate reference systems

## Documentation

1. Add a new **9. Coordinate reference systems** topic tutorial after Tutorial 8, with a Home/overview page and **9-1. Pre-requisites** and **9-2. Key concepts** pages as clearly marked placeholders. Include the usual steps list on the Home page without inventing lesson content.
2. Move the existing 4-5 exercise into **9-3. Using an alternative projection**, preserving its instructions and changing its page title and heading to the requested wording and number. Remove 4-5 from Tutorial 4’s steps list.
3. Update the Tutorials menu and tutorial page labels so Tutorial 9 appears among the Topics and its steps navigate in order. Remove the old 4-5 navigation entry and check for other links to its former location.

## Technical details

- Use `docs/workshops/09-coordinate-reference-systems/` for the four source pages and update `mkdocs.yml` and `docs/javascripts/nav-groups.js` for navigation and step labels.
- Regenerate the static guide in `public/guide/` using the existing MkDocs toolchain, then verify a strict guide build and the generated pages/navigation. This does not publish the site.
