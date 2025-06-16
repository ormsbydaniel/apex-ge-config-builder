
import { useState, useCallback } from 'react';

export const useLayerCardState = () => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = useCallback((cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  const isCardExpanded = useCallback((cardId: string) => {
    return expandedCards.has(cardId);
  }, [expandedCards]);

  const expandCard = useCallback((cardId: string) => {
    setExpandedCards(prev => new Set(prev).add(cardId));
  }, []);

  const collapseCard = useCallback((cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
  }, []);

  return {
    toggleCard,
    isCardExpanded,
    expandCard,
    collapseCard
  };
};
