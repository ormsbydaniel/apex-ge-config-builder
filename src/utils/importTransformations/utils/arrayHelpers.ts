
/**
 * Helper function to ensure an item is treated as an array
 */
export const ensureArray = (item: any): any[] => {
  return Array.isArray(item) ? item : [item];
};

/**
 * Check if all items in an array have a specific property with a given value
 */
export const checkItemsHaveProperty = (items: any[], property: string, value?: any): boolean => {
  return items.some((item: any) => {
    if (!item || typeof item !== 'object') return false;
    return value !== undefined ? item[property] === value : item.hasOwnProperty(property);
  });
};
