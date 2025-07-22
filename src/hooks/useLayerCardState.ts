
import { useState } from 'react';

export const useLayerCardState = () => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const expandCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    newExpanded.add(cardId);
    setExpandedCards(newExpanded);
  };

  const collapseCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    newExpanded.delete(cardId);
    setExpandedCards(newExpanded);
  };

  const isExpanded = (cardId: string) => expandedCards.has(cardId);

  return {
    toggleCard,
    expandCard,
    collapseCard,
    isExpanded,
    expandedCards
  };
};
