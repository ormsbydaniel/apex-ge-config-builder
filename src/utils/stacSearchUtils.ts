/**
 * STAC search and ranking utilities for filtering and prioritizing collections
 */

export interface StacCollection {
  id: string;
  title?: string;
  description?: string;
  keywords?: string[];
}

/**
 * Ranks a STAC collection based on search term relevance
 * Uses weighted scoring for different match types:
 * - Exact title match: 1000 points
 * - Whole word in title: 500 points
 * - Title starts with term: 400 points
 * - Partial title match: 300 points
 * - Exact keyword match: 250 points
 * - Whole word in keyword: 200 points
 * - Whole word in description: 100 points
 * - Partial keyword match: 50 points
 * - Partial description match: 25 points
 * 
 * @returns Score (higher is more relevant, 0 means no match)
 */
export const rankCollection = (collection: StacCollection, searchTerm: string): number => {
  const term = searchTerm.toLowerCase().trim();
  let score = 0;
  
  const title = (collection.title || collection.id).toLowerCase();
  const description = (collection.description || '').toLowerCase();
  const keywords = (collection.keywords || []).map(k => k.toLowerCase());
  
  // Create word boundary regex for whole-word matching
  const wholeWordRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  
  // Title matches (highest priority)
  if (title === term) {
    score += 1000; // Exact match
  } else if (wholeWordRegex.test(collection.title || collection.id)) {
    score += 500; // Whole word match
  } else if (title.startsWith(term)) {
    score += 400; // Starts with search term
  } else if (title.includes(term)) {
    score += 300; // Partial match in title
  }
  
  // Keywords matches
  keywords.forEach(keyword => {
    if (keyword === term) {
      score += 250; // Exact keyword match
    } else if (wholeWordRegex.test(keyword)) {
      score += 200; // Whole word in keyword
    } else if (keyword.includes(term)) {
      score += 50; // Partial match in keyword
    }
  });
  
  // Description matches (lower priority)
  if (wholeWordRegex.test(description)) {
    score += 100; // Whole word in description
  } else if (description.includes(term)) {
    score += 25; // Partial match in description
  }
  
  return score;
};

/**
 * Filters and sorts collections by search relevance
 * Returns empty array if no search term provided
 */
export const filterAndRankCollections = (
  collections: StacCollection[],
  searchTerm: string
): StacCollection[] => {
  const term = searchTerm.toLowerCase().trim();
  
  if (!term) return collections; // Show all if no search term
  
  // Filter and rank collections by score
  return collections
    .map(c => ({ collection: c, score: rankCollection(c, term) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.collection);
};
