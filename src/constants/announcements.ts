export interface Announcement {
  date: string; // ISO format date string
  title: string;
  category?: "Feature" | "Improvement" | "Fix" | "Info";
}

export const announcements: Announcement[] = [
  {
    date: "2026-02-13",
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
