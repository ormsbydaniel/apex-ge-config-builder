export interface GeoLocation {
  name: string;
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  type: 'continent' | 'country' | 'region';
  continent?: string; // For grouping countries
}

export const geoLocations: GeoLocation[] = [
  // Global view
  { name: 'Global View', center: [0, 20], zoom: 2, type: 'region' },
  
  // Continents
  { name: 'Africa', center: [20, 0], zoom: 3, type: 'continent' },
  { name: 'Asia', center: [100, 34], zoom: 3, type: 'continent' },
  { name: 'Europe', center: [15, 54], zoom: 4, type: 'continent' },
  { name: 'North America', center: [-100, 45], zoom: 3, type: 'continent' },
  { name: 'South America', center: [-60, -15], zoom: 3, type: 'continent' },
  { name: 'Oceania', center: [135, -25], zoom: 3, type: 'continent' },
  { name: 'Antarctica', center: [0, -80], zoom: 2, type: 'continent' },
  
  // North America
  { name: 'Canada', center: [-106, 56], zoom: 3, type: 'country', continent: 'North America' },
  { name: 'United States', center: [-95, 37], zoom: 4, type: 'country', continent: 'North America' },
  { name: 'Mexico', center: [-102, 23], zoom: 5, type: 'country', continent: 'North America' },
  
  // South America
  { name: 'Argentina', center: [-64, -34], zoom: 4, type: 'country', continent: 'South America' },
  { name: 'Brazil', center: [-47, -10], zoom: 4, type: 'country', continent: 'South America' },
  { name: 'Chile', center: [-71, -30], zoom: 4, type: 'country', continent: 'South America' },
  { name: 'Colombia', center: [-74, 4], zoom: 5, type: 'country', continent: 'South America' },
  { name: 'Peru', center: [-76, -10], zoom: 5, type: 'country', continent: 'South America' },
  
  // Europe
  { name: 'Austria', center: [14, 48], zoom: 7, type: 'country', continent: 'Europe' },
  { name: 'Belgium', center: [4, 51], zoom: 7, type: 'country', continent: 'Europe' },
  { name: 'Denmark', center: [10, 56], zoom: 6, type: 'country', continent: 'Europe' },
  { name: 'Finland', center: [26, 64], zoom: 5, type: 'country', continent: 'Europe' },
  { name: 'France', center: [2, 47], zoom: 6, type: 'country', continent: 'Europe' },
  { name: 'Germany', center: [10, 51], zoom: 6, type: 'country', continent: 'Europe' },
  { name: 'Greece', center: [22, 39], zoom: 6, type: 'country', continent: 'Europe' },
  { name: 'Ireland', center: [-8, 53], zoom: 7, type: 'country', continent: 'Europe' },
  { name: 'Italy', center: [12, 42], zoom: 6, type: 'country', continent: 'Europe' },
  { name: 'Netherlands', center: [5, 52], zoom: 7, type: 'country', continent: 'Europe' },
  { name: 'Norway', center: [9, 62], zoom: 5, type: 'country', continent: 'Europe' },
  { name: 'Poland', center: [19, 52], zoom: 6, type: 'country', continent: 'Europe' },
  { name: 'Portugal', center: [-8, 40], zoom: 6, type: 'country', continent: 'Europe' },
  { name: 'Russia', center: [100, 60], zoom: 3, type: 'country', continent: 'Europe' },
  { name: 'Spain', center: [-4, 40], zoom: 6, type: 'country', continent: 'Europe' },
  { name: 'Sweden', center: [15, 62], zoom: 5, type: 'country', continent: 'Europe' },
  { name: 'Switzerland', center: [8, 47], zoom: 7, type: 'country', continent: 'Europe' },
  { name: 'Ukraine', center: [32, 49], zoom: 6, type: 'country', continent: 'Europe' },
  { name: 'United Kingdom', center: [-2, 54], zoom: 6, type: 'country', continent: 'Europe' },
  
  // Asia
  { name: 'Bangladesh', center: [90, 24], zoom: 7, type: 'country', continent: 'Asia' },
  { name: 'China', center: [105, 35], zoom: 4, type: 'country', continent: 'Asia' },
  { name: 'India', center: [78, 22], zoom: 5, type: 'country', continent: 'Asia' },
  { name: 'Indonesia', center: [120, -2], zoom: 4, type: 'country', continent: 'Asia' },
  { name: 'Iran', center: [54, 32], zoom: 5, type: 'country', continent: 'Asia' },
  { name: 'Iraq', center: [44, 33], zoom: 6, type: 'country', continent: 'Asia' },
  { name: 'Israel', center: [35, 31], zoom: 7, type: 'country', continent: 'Asia' },
  { name: 'Japan', center: [138, 36], zoom: 5, type: 'country', continent: 'Asia' },
  { name: 'Malaysia', center: [102, 4], zoom: 6, type: 'country', continent: 'Asia' },
  { name: 'Pakistan', center: [69, 30], zoom: 5, type: 'country', continent: 'Asia' },
  { name: 'Philippines', center: [122, 13], zoom: 6, type: 'country', continent: 'Asia' },
  { name: 'Saudi Arabia', center: [45, 24], zoom: 5, type: 'country', continent: 'Asia' },
  { name: 'Singapore', center: [104, 1], zoom: 11, type: 'country', continent: 'Asia' },
  { name: 'South Korea', center: [128, 36], zoom: 7, type: 'country', continent: 'Asia' },
  { name: 'Thailand', center: [101, 15], zoom: 6, type: 'country', continent: 'Asia' },
  { name: 'Turkey', center: [35, 39], zoom: 6, type: 'country', continent: 'Asia' },
  { name: 'United Arab Emirates', center: [54, 24], zoom: 7, type: 'country', continent: 'Asia' },
  { name: 'Vietnam', center: [106, 16], zoom: 6, type: 'country', continent: 'Asia' },
  
  // Africa
  { name: 'Algeria', center: [3, 28], zoom: 5, type: 'country', continent: 'Africa' },
  { name: 'Egypt', center: [30, 26], zoom: 6, type: 'country', continent: 'Africa' },
  { name: 'Ethiopia', center: [39, 9], zoom: 6, type: 'country', continent: 'Africa' },
  { name: 'Ghana', center: [-2, 8], zoom: 7, type: 'country', continent: 'Africa' },
  { name: 'Kenya', center: [37, 1], zoom: 6, type: 'country', continent: 'Africa' },
  { name: 'Morocco', center: [-7, 32], zoom: 6, type: 'country', continent: 'Africa' },
  { name: 'Nigeria', center: [8, 9], zoom: 6, type: 'country', continent: 'Africa' },
  { name: 'South Africa', center: [25, -29], zoom: 5, type: 'country', continent: 'Africa' },
  { name: 'Tanzania', center: [35, -6], zoom: 6, type: 'country', continent: 'Africa' },
  
  // Oceania
  { name: 'Australia', center: [133, -25], zoom: 4, type: 'country', continent: 'Oceania' },
  { name: 'New Zealand', center: [174, -41], zoom: 5, type: 'country', continent: 'Oceania' },
];

// Helper function to group locations by type
export const groupedLocations = {
  global: geoLocations.filter(loc => loc.type === 'region'),
  continents: geoLocations.filter(loc => loc.type === 'continent'),
  countries: geoLocations.filter(loc => loc.type === 'country'),
};
