import { useState, useEffect } from "react";
import React from "react";
import { Navigation } from "@/components/Navigation";
import { UserMenu } from "@/components/UserMenu";
import { RangeEditor } from "@/components/RangeEditor";
import { Training } from "@/components/Training";
import { Chart, StoredChart, ChartButton } from "@/components/Chart";
import { ChartEditor } from "@/components/ChartEditor";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [activeSection, setActiveSection] = useState<'editor' | 'training' | 'chart' | 'chartEditor'>('chart');
  const [selectedChart, setSelectedChart] = useState<StoredChart | null>(null);
  const [forcedLayout, setForcedLayout] = useState<'desktop' | null>(null);
  const [forceMobileOnDesktop, setForceMobileOnDesktop] = useState(false);
  const isMobileDevice = useIsMobile();

  // State for all charts, managed in Index.tsx
  const [charts, setCharts] = useState<StoredChart[]>(() => {
    try {
      const storedCharts = localStorage.getItem("userCharts");
      return storedCharts ? JSON.parse(storedCharts) : [];
    } catch (error) {
      console.error("Failed to parse charts from localStorage:", error);
      return [];
    }
  });

  // Effect to save charts to localStorage whenever the charts state changes
  useEffect(() => {
    try {
      localStorage.setItem("userCharts", JSON.stringify(charts));
    } catch (error) {
      console.error("Failed to save charts to localStorage:", error);
    }
  }, [charts]);

  const isMobileLayout = (isMobileDevice && forcedLayout !== 'desktop') || (!isMobileDevice && forceMobileOnDesktop);

  // Function to handle editing a chart (navigates to editor)
  const handleEditChart = (chart: StoredChart) => {
    setSelectedChart(chart);
    setActiveSection('chartEditor');
  };

  // Function to create a new chart
  const handleCreateChart = (chartName: string) => {
    const newChart: StoredChart = {
      id: String(Date.now()),
      name: chartName.trim(),
      buttons: [], // New charts start with no buttons
    };
    setCharts((prevCharts) => [...prevCharts, newChart]);
  };

  // Function to delete a chart
  const handleDeleteChart = (id: string) => {
    setCharts((prevCharts) => prevCharts.filter((chart) => chart.id !== id));
  };

  // Function to save buttons for a specific chart (called from ChartEditor)
  const handleSaveChartButtons = (chartId: string, newButtons: ChartButton[]) => {
    setCharts((prevCharts) =>
      prevCharts.map((chart) =>
        chart.id === chartId ? { ...chart, buttons: newButtons } : chart
      )
    );
    // After saving, if the selected chart was updated, update it in state too
    setSelectedChart(prevSelected =>
      prevSelected && prevSelected.id === chartId
        ? { ...prevSelected, buttons: newButtons }
        : prevSelected
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'editor':
        return <RangeEditor isMobileMode={isMobileLayout} />;
      case 'training':
        return <Training isMobileMode={isMobileLayout} />;
      case 'chart':
        return (
          <Chart
            isMobileMode={isMobileLayout}
            charts={charts} // Pass charts from Index.tsx state
            onCreateChart={handleCreateChart} // Pass create function
            onDeleteChart={handleDeleteChart} // Pass delete function
            onEditChart={handleEditChart}
          />
        );
      case 'chartEditor':
        return selectedChart ? (
          <ChartEditor
            isMobileMode={isMobileLayout}
            chart={selectedChart}
            onBackToCharts={() => setActiveSection('chart')}
            onSaveChartButtons={handleSaveChartButtons} // Pass the save function
          />
        ) : null;
      default:
        return <RangeEditor isMobileMode={isMobileLayout} />;
    }
  };

  const LayoutToggleButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (isMobileDevice) {
          setForcedLayout(forcedLayout === 'desktop' ? null : 'desktop');
        } else {
          setForceMobileOnDesktop(!forceMobileOnDesktop);
        }
      }}
      className="flex items-center justify-center h-10 w-10 p-0"
    >
      {isMobileLayout ? (
        <Monitor className="h-4 w-4" />
      ) : (
        <Smartphone className="h-4 w-4" />
      )}
    </Button>
  );

  const mobileHeaderActions = (
    <div className="flex items-center gap-2 ml-auto">
      {LayoutToggleButton}
      <UserMenu isMobileMode={isMobileLayout} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {!isMobileLayout ? (
        // Desktop Layout
        <>
          <div className="py-1 border-b bg-card">
            <div className="flex items-center">
              <div className="w-80 flex-shrink-0 pl-4">
                <Navigation
                  activeSection={activeSection}
                  onSectionChange={setActiveSection}
                />
              </div>
              <div className="flex-1 flex items-center justify-end pr-4">
                <div className="flex items-center gap-2">
                  {LayoutToggleButton}
                  <UserMenu isMobileMode={isMobileLayout} />
                </div>
              </div>
            </div>
          </div>
          {renderSection()}
        </>
      ) : (
        // Mobile Layout
        <div className="min-h-screen bg-background flex flex-col">
          <div className="px-4 border-b bg-card">
            <div className="flex items-center justify-between">
              <Navigation
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                isMobile={true}
                mobileActions={mobileHeaderActions}
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            {renderSection()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
