export interface Announcement {
  date: string; // ISO format date string
  title: string;
  category?: 'Feature' | 'Improvement' | 'Fix' | 'Info';
}

export const announcements: Announcement[] = [
  {
    date: '2025-11-28',
    title: 'Version 3.4.2 in preview: Bug fix for service removal, clean up of deprecated export options, and addition of JSON file sorting as export option',
    category: 'Improvement',
  },
  {
    date: '2025-11-24',
    title: 'Config builder improvements for finding and adding data from STAC catalogues (e.g ESA Project Results Repository)',
    category: 'Improvement',
  },
];
