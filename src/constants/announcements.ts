export interface Announcement {
  date: string; // ISO format date string
  title: string;
  category?: 'Feature' | 'Improvement' | 'Fix' | 'Info';
}

export const announcements: Announcement[] = [
  {
    date: '2025-11-24',
    title: 'Config builder improvements for searching data in STAC catalogues',
    category: 'Improvement',
  },
];
