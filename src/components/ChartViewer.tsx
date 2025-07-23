import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { StoredChart, ChartButton } from "./Chart"; // Import interfaces
import { Range } from "@/contexts/RangeContext"; // Import Range interface
import { PokerMatrix } from "@/components/PokerMatrix"; // Import PokerMatrix
import { useRangeContext } from "@/contexts/RangeContext"; // Import useRangeContext

interface ChartViewerProps {
  isMobileMode?: boolean;
  chart: StoredChart;
  allRanges: Range[]; // Pass allRanges to resolve linked item names
  onBackToCharts: () => void;
}

export const ChartViewer = ({ isMobileMode = false, chart, allRanges, onBackToCharts }: ChartViewerProps) => {
  const { actionButtons } = useRangeContext(); // Get actionButtons from context
  const [displayedRange, setDisplayedRange] = useState<Range | null>(null); // State to hold the range to display
  const [showMatrixView, setShowMatrixView] = useState(false); // State to control showing matrix vs buttons

  const handleButtonClick = (button: ChartButton) => {
    const linkedRange = allRanges.find(range => range.id === button.linkedItem);
    if (linkedRange) {
      setDisplayedRange(linkedRange);
      setShowMatrixView(true); // Switch to matrix view
    } else {
      setDisplayedRange(null); // Clear displayed range if not found
      alert("Привязанный диапазон не найден.");
    }
  };

  const handleBackToButtons = () => {
    setDisplayedRange(null);
    setShowMatrixView(false); // Switch back to buttons view
  };

  return (
    <div className={cn(
      "p-6",
      isMobileMode ? "flex-1 overflow-y-auto" : "min-h-screen"
    )}>
      <div className={cn(
        "max-w-4xl mx-auto",
        isMobileMode ? "w-full" : ""
      )}>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBackToCharts} title="Назад к чартам">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Просмотр: {chart.name}</h1>
        </div>

        <div
          className="relative w-full h-[500px] border-2 border-solid border-muted-foreground rounded-lg bg-card flex items-center justify-center overflow-hidden"
        >
          {!showMatrixView ? (
            <>
              {/* Buttons visible when not in matrix view */}
              {chart.buttons.map((button) => (
                <Button
                  key={button.id}
                  style={{
                    backgroundColor: button.color,
                    position: 'absolute',
                    left: button.x,
                    top: button.y,
                    width: button.width,
                    height: button.height,
                  }}
                  className="flex items-center justify-center rounded-md shadow-md text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity z-20"
                  onClick={() => handleButtonClick(button)}
                >
                  {button.name}
                </Button>
              ))}

              {chart.buttons.length === 0 ? (
                <p className="text-muted-foreground z-10">В этом чарте нет кнопок.</p>
              ) : (
                <p className="text-muted-foreground z-10">Нажмите кнопку, чтобы просмотреть диапазон.</p>
              )}
            </>
          ) : (
            /* Conditionally render PokerMatrix when in matrix view */
            displayedRange ? (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <PokerMatrix
                  selectedHands={displayedRange.hands} // Pass the hands from the selected range
                  onHandSelect={() => {}} // No interaction in viewer mode
                  activeAction="" // No active action in viewer mode
                  actionButtons={actionButtons} // Pass actionButtons for coloring
                  readOnly={true} // Make it read-only
                  isBackgroundMode={true} // Use background mode styling
                />
              </div>
            ) : (
              <p className="text-muted-foreground z-10">Диапазон не найден.</p>
            )
          )}
        </div>

        {showMatrixView && (
          <div className="flex justify-center mt-6">
            <Button onClick={handleBackToButtons} variant="outline" className="px-8 py-2">
              Назад
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
