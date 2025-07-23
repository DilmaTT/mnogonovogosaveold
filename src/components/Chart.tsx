import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Define interfaces for ChartButton and StoredChart
export interface ChartButton {
  id: string;
  name: string;
  color: string;
  linkedItem: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StoredChart {
  id: string;
  name: string;
  buttons: ChartButton[];
}

interface ChartProps {
  isMobileMode?: boolean;
  charts: StoredChart[]; // Now receives charts from parent
  onCreateChart: (chartName: string) => void; // Function to create chart
  onDeleteChart: (chartId: string) => void; // Function to delete chart
  onEditChart: (chart: StoredChart) => void; // Now expects full chart object
}

export const Chart = ({ isMobileMode = false, charts, onCreateChart, onDeleteChart, onEditChart }: ChartProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChartName, setNewChartName] = useState("");

  const handleCreateChartClick = () => {
    setIsModalOpen(true);
    setNewChartName(""); // Clear input when opening modal
  };

  const handleSaveChart = () => {
    if (newChartName.trim()) {
      onCreateChart(newChartName); // Call the prop function
      setIsModalOpen(false);
      setNewChartName("");
    }
  };

  const handleDeleteChartClick = (id: string) => {
    onDeleteChart(id); // Call the prop function
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Мои Чарты</h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateChartClick} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать чарт
              </Button>
            </DialogTrigger>
            <DialogContent mobileFullscreen={isMobileMode}>
              <DialogHeader>
                <DialogTitle>Создать новый чарт</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  id="chartName"
                  placeholder="Имя чарта"
                  value={newChartName}
                  onChange={(e) => setNewChartName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
                <Button onClick={handleSaveChart}>Сохранить</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {charts.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <p>У вас пока нет созданных чартов.</p>
            <p>Нажмите "+ Создать чарт", чтобы добавить первый.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {charts.map((chart) => (
              <Card key={chart.id} className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">{chart.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" title="Настройки" onClick={() => onEditChart(chart)}>
                    <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Запустить">
                    <Play className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Удалить" onClick={() => handleDeleteChartClick(chart.id)}>
                    <Trash2 className="h-5 w-5 text-destructive hover:text-destructive/80" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
