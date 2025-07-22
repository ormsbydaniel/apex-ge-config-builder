import { useCallback } from 'react';

export const useScrollToLayer = () => {
  const scrollToLayer = useCallback((layerIndex: number, cardId?: string) => {
    // Use setTimeout to ensure the DOM has updated after state changes
    setTimeout(() => {
      // Try multiple possible selectors for the layer card
      const selectors = [
        `[data-layer-index="${layerIndex}"]`,
        `[data-card-id="${cardId}"]`,
        `[id="layer-${layerIndex}"]`,
        // Fallback: look for cards containing the layer index
        `[data-testid="layer-card-${layerIndex}"]`
      ];

      let element: Element | null = null;
      
      for (const selector of selectors) {
        element = document.querySelector(selector);
        if (element) break;
      }

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      } else {
        // Fallback: scroll to approximate position based on layer index
        // Estimate 200px per layer card
        const estimatedTop = layerIndex * 200;
        window.scrollTo({
          top: estimatedTop,
          behavior: 'smooth'
        });
      }
    }, 150); // Small delay to ensure DOM updates
  }, []);

  return { scrollToLayer };
};