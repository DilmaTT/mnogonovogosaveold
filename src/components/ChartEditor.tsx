import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRangeContext } from "@/contexts/RangeContext";
import { StoredChart, ChartButton } from "./Chart"; // Import interfaces

interface ChartEditorProps {
  isMobileMode?: boolean;
  chart: StoredChart; // Now receives full chart object
  onBackToCharts: () => void;
  onSaveChart: (updatedChart: StoredChart) => void; // Changed to save full chart
}

export const ChartEditor = ({ isMobileMode = false, chart, onBackToCharts, onSaveChart }: ChartEditorProps) => {
  const { folders } = useRangeContext();
  const allRanges = folders.flatMap(folder => folder.ranges);

  const [chartName, setChartName] = useState(chart.name);
  const [buttons, setButtons] = useState<ChartButton[]>(chart.buttons); // Initialize buttons from chart prop
  const [canvasWidth, setCanvasWidth] = useState(chart.canvasWidth || 800); // Initialize from chart or default
  const [canvasHeight, setCanvasHeight] = useState(chart.canvasHeight || 500); // Initialize from chart or default
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<ChartButton | null>(null);

  // Drag & Resize states
  const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Update chartName, buttons, and canvas dimensions if chart prop changes (e.g., if a different chart is selected)
  useEffect(() => {
    setChartName(chart.name);
    setButtons(chart.buttons);
    setCanvasWidth(chart.canvasWidth || 800);
    setCanvasHeight(chart.canvasHeight || 500);
  }, [chart]);

  const handleAddButton = () => {
    const newButton: ChartButton = {
      id: String(Date.now()),
      name: "Новая кнопка",
      color: "#60A5FA",
      linkedItem: allRanges.length > 0 ? allRanges[0].id : "",
      x: 50,
      y: 50,
      width: 120, // Default width
      height: 40, // Default height
      type: 'normal', // Default type for new buttons
    };
    setButtons((prev) => [...prev, newButton]);
    setEditingButton(newButton);
    setIsButtonModalOpen(true);
  };

  const handleSettingsClick = (e: React.MouseEvent, button: ChartButton) => {
    e.stopPropagation(); // Prevent drag/resize from starting
    setEditingButton(button);
    setIsButtonModalOpen(true);
  };

  const handleSaveButtonProperties = () => {
    if (editingButton) {
      setButtons((prev) =>
        prev.map((btn) => (btn.id === editingButton.id ? editingButton : btn))
      );
      setIsButtonModalOpen(false);
      setEditingButton(null);
    }
  };

  const handleCancelButtonProperties = () => {
    if (editingButton && !buttons.some(b => b.id === editingButton.id)) {
      setButtons((prev) => prev.filter(b => b.id !== editingButton.id));
    }
    setIsButtonModalOpen(false);
    setEditingButton(null);
  };

  // --- Drag & Resize Logic ---

  const getResizeDirection = useCallback((e: React.MouseEvent, button: ChartButton) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tolerance = 8; // Pixels from edge to detect resize

    let direction = null;
    if (x < tolerance && y < tolerance) direction = 'nw';
    else if (x > rect.width - tolerance && y < tolerance) direction = 'ne';
    else if (x < tolerance && y > rect.height - tolerance) direction = 'sw';
    else if (x > rect.width - tolerance && y > rect.height - tolerance) direction = 'se';
    else if (x < tolerance) direction = 'w';
    else if (x > rect.width - tolerance) direction = 'e';
    else if (y < tolerance) direction = 'n';
    else if (y > rect.height - tolerance) direction = 's';
    return direction;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, button: ChartButton) => {
    // Only start drag/resize if not clicking the settings icon
    if ((e.target as HTMLElement).closest('.settings-icon')) {
      return;
    }

    e.stopPropagation(); // Prevent button click from opening modal immediately
    setActiveButtonId(button.id);

    const direction = getResizeDirection(e, button);
    if (direction) {
      setIsResizing(true);
      setResizeDirection(direction);
    } else {
      setIsDragging(true);
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); // Use currentTarget for the button itself
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [getResizeDirection]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeButtonId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentButton = buttons.find(b => b.id === activeButtonId);
    if (!currentButton) return;

    if (isDragging) {
      let newX = e.clientX - dragOffset.x - canvasRect.left;
      let newY = e.clientY - dragOffset.y - canvasRect.top;

      // Boundary checks for dragging
      newX = Math.max(0, Math.min(newX, canvasRect.width - currentButton.width));
      newY = Math.max(0, Math.min(newY, canvasRect.height - currentButton.height));

      setButtons((prev) =>
        prev.map((btn) =>
          btn.id === activeButtonId ? { ...btn, x: newX, y: newY } : btn
        )
      );
    } else if (isResizing && resizeDirection) {
      let newWidth = currentButton.width;
      let newHeight = currentButton.height;
      let newX = currentButton.x;
      let newY = currentButton.y;

      const minSize = 50; // Minimum button size

      switch (resizeDirection) {
        case 'e':
          newWidth = Math.max(minSize, e.clientX - (currentButton.x + canvasRect.left));
          break;
        case 's':
          newHeight = Math.max(minSize, e.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'w':
          const diffX = e.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(minSize, currentButton.width - diffX);
          newX = currentButton.x + diffX;
          break;
        case 'n':
          const diffY = e.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(minSize, currentButton.height - diffY);
          newY = currentButton.y + diffY;
          break;
        case 'se':
          newWidth = Math.max(minSize, e.clientX - (currentButton.x + canvasRect.left));
          newHeight = Math.max(minSize, e.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'sw':
          const diffX_sw = e.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(minSize, currentButton.width - diffX_sw);
          newX = currentButton.x + diffX_sw;
          newHeight = Math.max(minSize, e.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'ne':
          newWidth = Math.max(minSize, e.clientX - (currentButton.x + canvasRect.left));
          const diffY_ne = e.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(minSize, currentButton.height - diffY_ne);
          newY = currentButton.y + diffY_ne;
          break;
        case 'nw':
          const diffX_nw = e.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(minSize, currentButton.width - diffX_nw);
          newX = currentButton.x + diffX_nw;
          const diffY_nw = e.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(minSize, currentButton.height - diffY_nw);
          newY = currentButton.y + diffY_nw;
          break;
      }

      // Ensure button stays within canvas boundaries after resize
      newX = Math.max(0, Math.min(newX, canvasRect.width - newWidth));
      newY = Math.max(0, Math.min(newY, canvasRect.height - newHeight));
      newWidth = Math.min(newWidth, canvasRect.width - newX);
      newHeight = Math.min(newHeight, canvasRect.height - newY);


      setButtons((prev) =>
        prev.map((btn) =>
          btn.id === activeButtonId ? { ...btn, x: newX, y: newY, width: newWidth, height: newHeight } : btn
        )
      );
    }
  }, [activeButtonId, isDragging, isResizing, dragOffset, resizeDirection, buttons]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveButtonId(null);
    setResizeDirection(null);
  }, []);

  const handleButtonMouseMove = useCallback((e: React.MouseEvent, button: ChartButton) => {
    if (isDragging || isResizing) return; // Don't change cursor if already dragging/resizing

    const direction = getResizeDirection(e, button);
    if (direction) {
      (e.currentTarget as HTMLElement).style.cursor = `${direction}-resize`;
    } else {
      (e.currentTarget as HTMLElement).style.cursor = 'grab';
    }
  }, [isDragging, isResizing, getResizeDirection]);

  const handleButtonMouseLeave = useCallback((e: React.MouseEvent) => {
    if (isDragging || isResizing) return;
    (e.currentTarget as HTMLElement).style.cursor = 'default';
  }, [isDragging, isResizing]);


  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // --- End Drag & Resize Logic ---

  const handleBackButtonClick = () => {
    const updatedChart: StoredChart = {
      ...chart,
      name: chartName,
      buttons: buttons,
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
    };
    onSaveChart(updatedChart); // Save all chart properties before navigating back
    onBackToCharts();
  };

  return (
    <div className={cn(
      "p-6",
      isMobileMode ? "flex-1 overflow-y-auto" : "min-h-screen"
    )}>
      <div className={cn(
        "mx-auto", // Removed max-w-4xl to allow canvas to expand
        isMobileMode ? "w-full" : ""
      )}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackButtonClick} title="Назад к чартам">
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{chartName}</h1>
          </div>
          <Button onClick={handleAddButton} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить кнопку
          </Button>
        </div>

        {/* Canvas size controls */}
        <div className="flex items-center gap-4 mb-4">
          <Label htmlFor="canvasWidth" className="text-right">
            Ширина
          </Label>
          <Input
            id="canvasWidth"
            type="number"
            value={canvasWidth}
            onChange={(e) => setCanvasWidth(parseInt(e.target.value) || 0)}
            className="w-20"
            min="100"
            maxLength={4}
          />
          <Label htmlFor="canvasHeight" className="text-right">
            Высота
          </Label>
          <Input
            id="canvasHeight"
            type="number"
            value={canvasHeight}
            onChange={(e) => setCanvasHeight(parseInt(e.target.value) || 0)}
            className="w-20"
            min="100"
            maxLength={4}
          />
        </div>

        <div
          ref={canvasRef}
          className="relative border-2 border-dashed border-muted-foreground rounded-lg bg-card flex items-center justify-center overflow-hidden"
          style={{ width: canvasWidth, height: canvasHeight }} // Apply dynamic width and height
        >
          {buttons.length === 0 && (
            <p className="text-muted-foreground">Рабочая область (холст)</p>
          )}
          {buttons.map((button) => (
            <div
              key={button.id}
              style={{
                backgroundColor: button.color,
                position: 'absolute',
                left: button.x,
                top: button.y,
                width: button.width, // Apply width
                height: button.height, // Apply height
                zIndex: activeButtonId === button.id ? 100 : 1, // Bring active button to front
              }}
              className="relative flex items-center justify-center rounded-md shadow-md text-white font-semibold group" // Added group for hover effects
              onMouseDown={(e) => handleMouseDown(e, button)}
              onMouseMove={(e) => handleButtonMouseMove(e, button)}
              onMouseLeave={handleButtonMouseLeave}
            >
              {button.name}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity settings-icon" // Added settings-icon class
                onClick={(e) => handleSettingsClick(e, button)}
                title="Настройки кнопки"
              >
                <Settings className="h-4 w-4 text-white" />
              </Button>
            </div>
          ))}
        </div>

        <Dialog open={isButtonModalOpen} onOpenChange={setIsButtonModalOpen}>
          <DialogContent mobileFullscreen={isMobileMode}>
            <DialogHeader>
              <DialogTitle>Настройка кнопки</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buttonName" className="text-right">
                  Название
                </Label>
                <Input
                  id="buttonName"
                  value={editingButton?.name || ""}
                  onChange={(e) => setEditingButton(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buttonColor" className="text-right">
                  Цвет
                </Label>
                <Input
                  id="buttonColor"
                  type="color"
                  value={editingButton?.color || "#000000"}
                  onChange={(e) => setEditingButton(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="col-span-3 h-10"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="linkedItem" className="text-right">
                  Привязать
                </Label>
                <Select
                  value={editingButton?.linkedItem || ""}
                  onValueChange={(value) => setEditingButton(prev => prev ? { ...prev, linkedItem: value } : null)}
                  disabled={editingButton?.type === 'exit'} // Disable if it's an exit button
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={editingButton?.type === 'exit' ? "Выход из режима просмотра чарта" : "Выберите чарт/диапазон"} />
                  </SelectTrigger>
                  <SelectContent>
                    {editingButton?.type === 'exit' ? (
                      // Assign a non-empty, unique value for the disabled exit item
                      <SelectItem value="exit-chart-placeholder" disabled>Выход из режима просмотра чарта</SelectItem>
                    ) : (
                      allRanges.length === 0 ? (
                        // Assign a non-empty, unique value for the disabled "no ranges" item
                        <SelectItem value="no-ranges-available-placeholder" disabled>Нет доступных диапазонов</SelectItem>
                      ) : (
                        allRanges.map(range => (
                          <SelectItem key={range.id} value={range.id}>
                            {range.name}
                          </SelectItem>
                        ))
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              {/* Add width and height inputs for manual adjustment if needed, or just rely on drag/resize */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buttonWidth" className="text-right">
                  Ширина
                </Label>
                <Input
                  id="buttonWidth"
                  type="number"
                  value={editingButton?.width || 0}
                  onChange={(e) => setEditingButton(prev => prev ? { ...prev, width: parseInt(e.target.value) || 0 } : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buttonHeight" className="text-right">
                  Высота
                </Label>
                <Input
                  id="buttonHeight"
                  type="number"
                  value={editingButton?.height || 0}
                  onChange={(e) => setEditingButton(prev => prev ? { ...prev, height: parseInt(e.target.value) || 0 } : null)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelButtonProperties}>Отмена</Button>
              <Button onClick={handleSaveButtonProperties}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
