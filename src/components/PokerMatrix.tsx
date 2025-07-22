import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";

// Poker hand matrix data
const HANDS = [
  ['AA', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s'],
  ['AKo', 'KK', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s'],
  ['AQo', 'KQo', 'QJo', 'JJ', 'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s'],
  ['AJo', 'KJo', 'QJo', 'JJ', 'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s'],
  ['ATo', 'KTo', 'QTo', 'JTo', 'TT', 'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s'],
  ['A9o', 'K9o', 'Q9o', 'J9o', 'T9o', '99', '98s', '97s', '96s', '95s', '94s', '93s', '92s'],
  ['A8o', 'K8o', 'Q8o', 'J8o', 'T8o', '98o', '88', '87s', '86s', '85s', '84s', '83s', '82s'],
  ['A7o', 'K7o', 'Q7o', 'J7o', 'T7o', '97o', '87o', '77', '76s', '75s', '74s', '73s', '72s'],
  ['A6o', 'K6o', 'Q6o', 'J6o', 'T6o', '96o', '86o', '76o', '66', '65s', '64s', '63s', '62s'],
  ['A5o', 'K5o', 'Q5o', 'J5o', 'T5o', '95o', '85o', '75o', '65o', '55', '54s', '53s', '52s'],
  ['A4o', 'K4o', 'Q4o', 'J4o', 'T4o', '94o', '84o', '74o', '64o', '54o', '44', '43s', '42s'],
  ['A3o', 'K3o', 'Q3o', 'J3o', 'T3o', '93o', '83o', '73o', '63o', '53o', '43o', '33', '32s'],
  ['A2o', 'K2o', 'Q2o', 'J2o', 'T2o', '92o', '82o', '72o', '62o', '52o', '42o', '32o', '22']
];

interface ActionButton {
  id: string;
  name: string;
  color: string;
}

interface PokerMatrixProps {
  selectedHands: Record<string, string>;
  onHandSelect: (hand: string, mode: 'select' | 'deselect') => void;
  activeAction: string;
  actionButtons: ActionButton[];
  readOnly?: boolean;
}

export const PokerMatrix = ({ selectedHands, onHandSelect, activeAction, actionButtons, readOnly = false }: PokerMatrixProps) => {
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);
  const lastHandEnteredRef = useRef<string | null>(null);
  // Initialize zoomLevel to 0.85 (15% reduction) for desktop, 1 for mobile
  const [zoomLevel, setZoomLevel] = useState<number>(isMobile ? 1 : 0.85);

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragMode(null);
    lastHandEnteredRef.current = null;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);
    window.addEventListener('touchcancel', handleDragEnd);

    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, []);

  const handleMouseDown = (hand: string) => {
    if (readOnly) return;
    setIsDragging(true);
    lastHandEnteredRef.current = hand;

    const currentHandAction = selectedHands[hand];
    const mode = currentHandAction === activeAction ? 'deselect' : 'select';
    
    setDragMode(mode);
    onHandSelect(hand, mode);
  };

  const handleMouseEnter = (hand: string) => {
    if (readOnly || !isDragging || !dragMode) return;
    
    if (lastHandEnteredRef.current !== hand) {
      onHandSelect(hand, dragMode);
      lastHandEnteredRef.current = hand;
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    event.preventDefault();

    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element instanceof HTMLElement && element.dataset.hand) {
      const hand = element.dataset.hand;
      handleMouseEnter(hand);
    }
  };

  const getHandColor = (hand: string) => {
    const action = selectedHands[hand];
    if (!action || action === 'fold') return 'bg-muted/50 text-muted-foreground hover:bg-muted/70';
    
    const button = actionButtons.find(b => b.id === action);
    return button ? '' : 'bg-muted/50 text-muted-foreground hover:bg-muted/70';
  };

  const getHandStyle = (hand: string) => {
    const action = selectedHands[hand];
    if (!action || action === 'fold') return {};
    
    const button = actionButtons.find(b => b.id === action);
    return button ? { backgroundColor: button.color, color: 'white' } : {};
  };

  const parentContainerClasses = cn(
    "space-y-4",
    isMobile ? "w-full !px-0" : "w-[120%]" // Added !px-0 for mobile to remove padding
  );
  
  const gridClasses = cn(
    "grid grid-cols-13 aspect-square w-full select-none rounded-lg border",
    isMobile ? "gap-0.5 sm:gap-1" : "gap-2 p-6"
  );
  
  const buttonClasses = cn(
    "w-full h-full aspect-square font-mono border transition-all duration-200",
    "hover:ring-2 hover:ring-ring",
    "rounded-sm md:rounded-md",
    isMobile ? "text-[clamp(0.625rem,1.5vw,0.875rem)] p-0" : "text-[clamp(0.75rem,1.8vw,1.05rem)] p-1"
  );

  const matrixContent = (
    <div
      className={gridClasses}
      onTouchMove={handleTouchMove}
    >
      {HANDS.map((row, rowIndex) => 
        row.map((hand, colIndex) => (
          <Button
            key={`${rowIndex}-${colIndex}`}
            data-hand={hand}
            variant="outline"
            size="sm"
            className={cn(
              buttonClasses,
              getHandColor(hand)
            )}
            style={getHandStyle(hand)}
            onMouseDown={() => handleMouseDown(hand)}
            onMouseEnter={() => handleMouseEnter(hand)}
            onTouchStart={(e) => {
              e.preventDefault();
              handleMouseDown(hand);
            }}
            disabled={readOnly}
          >
            {hand}
          </Button>
        ))
      )}
    </div>
  );

  return (
    <div className={parentContainerClasses}>
      {isMobile ? (
        // Mobile: Render directly without scale wrapper
        matrixContent
      ) : (
        // Desktop: Render with scale wrapper and zoom buttons
        <div
          className="relative w-full"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          {matrixContent}
          <div className="absolute -bottom-6 left-0 flex gap-1">
            <Button variant="outline" size="sm" className="h-5 w-10 text-xs" onClick={() => setZoomLevel(0.85)}>x1</Button>
            <Button variant="outline" size="sm" className="h-5 w-10 text-xs" onClick={() => setZoomLevel(1.0)}>x1.2</Button>
            <Button variant="outline" size="sm" className="h-5 w-10 text-xs" onClick={() => setZoomLevel(1.2)}>x1.5</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to get the number of combinations for a given hand type
export const getCombinations = (hand: string): number => {
  if (hand.length === 2 && hand[0] === hand[1]) { // Pair, e.g., 'AA'
    return 6;
  }
  if (hand.endsWith('s')) { // Suited, e.g., 'AKs'
    return 4;
  }
  if (hand.endsWith('o')) { // Offsuit, e.g., 'AKo'
    return 12;
  }
  return 0; // Should not happen for valid poker hands
};

// Calculate total possible combinations (1326)
export const TOTAL_POKER_COMBINATIONS = HANDS.flat().reduce((sum, hand) => sum + getCombinations(hand), 0);
