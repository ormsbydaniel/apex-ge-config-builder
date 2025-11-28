export interface Announcement {
  date: string; // ISO format date string
  title: string;
  category?: "Feature" | "Improvement" | "Fix" | "Info";
}

export const announcements: Announcement[] = [
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
