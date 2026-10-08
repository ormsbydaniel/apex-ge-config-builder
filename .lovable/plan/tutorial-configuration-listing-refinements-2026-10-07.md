# Tutorial configuration listing refinements

## Changes

- Move **Tutorials** to the far-right position in the Load Configuration tab list, after **From GitHub**.
- Extend tutorial filename parsing to accept dated files such as `tutorial-3-completion_20261007_1558.json`, while retaining support for the existing undated filename format.
- Group files by tutorial number and type (`prerequisite` or `completion`) and show only the newest dated file in each group. Treat an undated file as older when a dated version exists.
- Keep the existing plain labels, such as **Tutorial 3 completion**.
- Add a **Last updated** note to each dated tutorial description, interpreting the filename timestamp as UTC and formatting it as a readable date and time.

## Verification

- Add parser tests for dated filenames, newest-version selection, independent prerequisite/completion entries, sorting, invalid timestamps, and fallback to undated files.
- Check the Load Configuration dialog to confirm Tutorials is last and each listed tutorial loads the selected newest file URL.

## Technical details

- Keep filename parsing, version grouping, and date formatting in the tutorial configuration utility so the dialog remains presentation-only.
- Use the timestamp suffix as the source of update metadata; no additional GitHub request is needed.
