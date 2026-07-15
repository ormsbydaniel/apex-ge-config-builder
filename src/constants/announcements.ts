export interface Announcement {
  date: string; // ISO format date string
  title: string;
  category?: "Feature" | "Improvement" | "Fix" | "Info";
}

export const announcements: Announcement[] = [
  {
    date: "2026-07-15",
    title: "Release 2.1.0 with support for storymaps",
    category: "Feature",
  },
  {
    date: "2026-07-02",
    title: "Deployment to https://ge-config-builder.apex.esa.int/ and https://ge-config-builder.dev.apex.esa.int/",
    category: "Info",
  },
  {
    date: "2026-06-25",
    title: "Config Builder settings and tabs (currently hidden) for algorithms and storymaps",
    category: "Feature",
  },
  {
    date: "2026-05-13",
    title: "Support for static STAC collections",
    category: "Feature",
  },
  {
    date: "2026-05-12",
    title: "Remove or fix invalid layers on config load",
    category: "Feature",
  },
  {
    date: "2026-05-05",
    title: "Categories editor: CSV import/export, simpler copy-from-layer, stale state fix",
    category: "Improvement",
  },
  {
    date: "2026-05-05",
    title: "UI for vector data styling (beta)",
    category: "Feature",
  },
  {
    date: "2026-04-30",
    title: "Added Healthcheck dashboard",
    category: "Feature",
  },
  {
    date: "2026-04-28",
    title: "Inline charts support and import layer from config (beta)",
    category: "Feature",
  },
  {
    date: "2026-04-24",
    title: "Customisable filename prefix in settings and date stamped suffix on export. Fix to WMTS service parsing.",
    category: "Feature",
  },
  {
    date: "2026-04-23",
    title: "Performance improvements to config load.  Services validation.",
    category: "Improvement",
  },
  {
    date: "2026-04-17",
    title: "Config load UI with Upload, Examples and GitHub config pickers",
    category: "Feature",
  },
  {
    date: "2026-03-27",
    title:
      "Recommended services improvement allowing users to choose which services are added (rather than all).  Interface sub-groups improvement with 'select all' option for including layers in sub-group.",
    category: "Improvement",
  },
  {
    date: "2026-03-25",
    title:
      "Improvements to S3 browser. Addition of vector data styling UI control currently with direct JSON entry. Update to Description UI to include details of supported markdown. URL parameter details added in to Settings.",
    category: "Improvement",
  },
  {
    date: "2026-03-24",
    title: "Footer links configuration added to Settings",
    category: "Feature",
  },
  {
    date: "2026-03-19",
    title:
      "Revamp of layer card user interface with direct editing via dialogue popups. Includes initial release of RGB composite styling.  Added latest GE development as 3.7.0 release candidate.",
    category: "Feature",
  },
  {
    date: "2026-03-09",
    title: "Added dev-pixel-charts to preview.",
    category: "Feature",
  },
  {
    date: "2026-02-27",
    title: "Paginated data source lists and remove all option. COG metadata support for multi-band COGs.",
    category: "Feature",
  },
  {
    date: "2026-02-26",
    title: "Addition of 3.6.0-rc version",
    category: "Feature",
  },
  {
    date: "2026-02-02",
    title: "Support for sub-interface groups and example config load",
    category: "Feature",
  },
  {
    date: "2026-01-29",
    title: "3.5.0 release and support for full screen mode",
    category: "Feature",
  },
  {
    date: "2026-01-23",
    title: "Field configuration for vector layer data values",
    category: "Feature",
  },
  {
    date: "2026-01-22",
    title: "dev-3.5-candidate version added to Preview",
    category: "Feature",
  },
  {
    date: "2026-01-19",
    title: "Addition of chart configuration into data sources",
    category: "Feature",
  },
  {
    date: "2025-12-17",
    title: "STAC services now support collection level entry point, rather than assuming a catalogue",
    category: "Feature",
  },
  {
    date: "2025-12-15",
    title:
      "Added 'Time' option to timeframe definition for sub-day temporal granularity with date and time picker support",
    category: "Feature",
  },
  {
    date: "2025-11-28",
    title:
      "GE 3.4.2 added to preview. Bug fix for service removal. Clean up of deprecated export options. Addition of JSON file sorting as export option",
    category: "Improvement",
  },
  {
    date: "2025-11-24",
    title:
      "Config builder improvements for finding and adding data from STAC catalogues (e.g ESA Project Results Repository)",
    category: "Improvement",
  },
];
