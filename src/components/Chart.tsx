import React from "react";

interface ChartProps {
  isMobileMode?: boolean;
}

export const Chart = ({ isMobileMode = false }: ChartProps) => {
  return (
    <div className="bg-background p-6 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Раздел Чарт</h1>
        <p className="text-muted-foreground">
          Здесь будет отображаться информация о чартах.
        </p>
      </div>
    </div>
  );
};
