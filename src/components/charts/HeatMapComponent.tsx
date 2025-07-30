import React, { memo, useMemo } from 'react';
import { AnalyticsDataPoint } from '@/types/analytics';

interface HeatMapComponentProps {
  data: AnalyticsDataPoint[];
  height?: number;
}

interface HeatMapCell {
  x: number;
  y: number;
  value: number;
  label: string;
}

export const HeatMapComponent = memo(({
  data,
  height = 300
}: HeatMapComponentProps) => {
  const heatMapData = useMemo(() => {
    if (!data.length) return { cells: [], pages: [], cellSize: 40 };

    // Create a grid of user flow interactions
    const flowMap = new Map<string, number>();
    
    data.forEach(point => {
      point.userFlow.forEach(flow => {
        const key = `${flow.from}-${flow.to}`;
        flowMap.set(key, (flowMap.get(key) || 0) + flow.count);
      });
    });

    // Get unique pages for x and y axes
    const pages = new Set<string>();
    data.forEach(point => {
      point.userFlow.forEach(flow => {
        pages.add(flow.from);
        pages.add(flow.to);
      });
    });

    const pageArray = Array.from(pages).slice(0, 8); // Limit to 8 pages for visibility
    const cellSize = 40;
    const cells: HeatMapCell[] = [];

    pageArray.forEach((fromPage, x) => {
      pageArray.forEach((toPage, y) => {
        const key = `${fromPage}-${toPage}`;
        const value = flowMap.get(key) || 0;
        cells.push({
          x: x * cellSize,
          y: y * cellSize,
          value,
          label: `${fromPage} → ${toPage}`
        });
      });
    });

    return { cells, pages: pageArray, cellSize };
  }, [data]);

  const maxValue = heatMapData.cells.length > 0 
    ? Math.max(...heatMapData.cells.map(cell => cell.value), 1)
    : 1;

  const getIntensity = (value: number) => {
    const intensity = value / maxValue;
    return `rgba(59, 130, 246, ${Math.max(0.1, intensity)})`;
  };

  if (!heatMapData.cells.length) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-500">No user flow data available</p>
      </div>
    );
  }

  const { cells, pages, cellSize } = heatMapData;
  const svgWidth = pages.length * cellSize;
  const svgHeight = pages.length * cellSize;

  return (
    <div className="w-full overflow-auto">
      <svg
        width={svgWidth + 100} // Extra space for labels
        height={svgHeight + 100}
        className="bg-white"
      >
        {/* Y-axis labels */}
        {pages.map((page, index) => (
          <text
            key={`y-${page}`}
            x={90}
            y={index * cellSize + cellSize / 2 + 4}
            textAnchor="end"
            fontSize="12"
            fill="#6b7280"
            className="text-xs"
          >
            {page.length > 10 ? `${page.substring(0, 10)}...` : page}
          </text>
        ))}

        {/* X-axis labels */}
        {pages.map((page, index) => (
          <text
            key={`x-${page}`}
            x={100 + index * cellSize + cellSize / 2}
            y={svgHeight + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
            className="text-xs"
            transform={`rotate(-45, ${100 + index * cellSize + cellSize / 2}, ${svgHeight + 20})`}
          >
            {page.length > 10 ? `${page.substring(0, 10)}...` : page}
          </text>
        ))}

        {/* Heat map cells */}
        {cells.map((cell, index) => (
          <g key={index}>
            <rect
              x={100 + cell.x}
              y={cell.y}
              width={cellSize - 1}
              height={cellSize - 1}
              fill={getIntensity(cell.value)}
              stroke="#ffffff"
              strokeWidth={1}
              className="hover:stroke-gray-400 cursor-pointer"
            >
              <title>{`${cell.label}: ${cell.value} transitions`}</title>
            </rect>
            {cell.value > 0 && (
              <text
                x={100 + cell.x + cellSize / 2}
                y={cell.y + cellSize / 2 + 4}
                textAnchor="middle"
                fontSize="10"
                fill={cell.value / maxValue > 0.5 ? '#ffffff' : '#374151'}
                className="pointer-events-none"
              >
                {cell.value}
              </text>
            )}
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${svgWidth + 20}, 20)`}>
          <text x={0} y={0} fontSize="12" fill="#374151" fontWeight="bold">
            Transitions
          </text>
          <rect x={0} y={10} width={20} height={10} fill="rgba(59, 130, 246, 0.1)" />
          <text x={25} y={19} fontSize="10" fill="#6b7280">Low</text>
          <rect x={0} y={25} width={20} height={10} fill="rgba(59, 130, 246, 1)" />
          <text x={25} y={34} fontSize="10" fill="#6b7280">High</text>
        </g>
      </svg>
    </div>
  );
});

HeatMapComponent.displayName = 'HeatMapComponent';