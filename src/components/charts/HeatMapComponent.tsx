import React, { memo, useMemo } from 'react';
import { AnalyticsDataPoint } from '@/types/analytics';
import { useTheme } from '@/hooks/useTheme';

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
  height = 400
}: HeatMapComponentProps) => {
  const { isDark, mounted } = useTheme();
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

    const pageArray = Array.from(pages).slice(0, 6); // Limit to 6 pages for better visibility
    const cellSize = 50;
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
    if (value === 0) {
      return isDark ? '#2C2C2E' : '#F2F2F7';
    }
    
    const intensity = value / maxValue;
    
    if (isDark) {
      // In dark mode, use brighter colors with higher base opacity
      const alpha = Math.max(0.3, intensity * 0.85);
      return `rgba(59, 130, 246, ${alpha})`; // Better blue for dark mode
    } else {
      // In light mode, use more subtle colors
      const alpha = Math.max(0.15, intensity * 0.7);
      return `rgba(37, 99, 235, ${alpha})`; // Better blue for light mode
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ height }}>
        <div className="text-muted-foreground">Loading heatmap...</div>
      </div>
    );
  }

  if (!heatMapData.cells.length) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-muted"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-muted-foreground font-medium">No user flow data available</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Data will appear here once user interactions are tracked</p>
        </div>
      </div>
    );
  }

  const { cells, pages, cellSize } = heatMapData;
  const svgWidth = pages.length * cellSize;
  const svgHeight = pages.length * cellSize;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="min-w-0 flex-1 max-w-full h-full">
        <svg
          width="100%"
          height={Math.max(svgHeight + 160, height)}
          className="flex items-center justify-center max-w-full h-full"
          viewBox={`0 0 ${Math.max(svgWidth + 200, 600)} ${Math.max(svgHeight + 160, height)}`}
          preserveAspectRatio="xMidYMid meet"
        >
        {/* Y-axis labels */}
        {pages.map((page, index) => (
          <text
            key={`y-${page}`}
            x={110}
            y={index * cellSize + cellSize / 2 + 4 + 20}
            textAnchor="end"
            fontSize="13"
            fill="currentColor"
            className="text-sm font-medium text-foreground m-2"
          >
            {page.length > 10 ? `${page.substring(0, 10)}...` : page}
          </text>
        ))}

        {/* X-axis labels */}
        {pages.map((page, index) => (
          <text
            key={`x-${page}`}
            x={100 + index * cellSize + cellSize / 2}
            y={svgHeight + 50}
            textAnchor="middle"
            fontSize="13"
            fill="currentColor"
            className="text-sm font-medium text-foreground"
            transform={`rotate(-45, ${120 + index * cellSize + cellSize / 2}, ${svgHeight + 40})`}
          >
            {page.length > 10 ? `${page.substring(0, 10)}...` : page}
          </text>
        ))}

        {/* Heat map cells */}
        {cells.map((cell, index) => (
          <g key={index}>
            <rect
              x={120 + cell.x}
              y={cell.y + 20}
              width={cellSize - 2}
              height={cellSize - 2}
              fill={getIntensity(cell.value)}
              stroke="hsl(var(--border))"
              strokeWidth={1}
              rx={4}
              className="hover:stroke-primary hover:stroke-2 cursor-pointer transition-all duration-200 hover:opacity-90 hover:drop-shadow-sm"
            >
              <title>{`${cell.label}: ${cell.value} transitions`}</title>
            </rect>
            {cell.value > 0 && (
              <text
                x={120 + cell.x + cellSize / 2}
                y={cell.y + 20 + cellSize / 2 + 4}
                textAnchor="middle"
                fontSize="12"
                fill={(() => {
                  const intensity = cell.value / maxValue;
                  
                  if (isDark) {
                    // In dark mode, use black text for high intensity, white text for low
                    return intensity > 0.6 ? '#000000' : '#FFFFFF';
                  } else {
                    // In light mode, use white text for high intensity, dark text for low
                    return intensity > 0.4 ? '#FFFFFF' : '#1F2937';
                  }
                })()}
                className="pointer-events-none font-semibold"
              >
                {cell.value}
              </text>
            )}
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${Math.max(svgWidth + 150, 460)}, 40)`}>
          {(() => {
            const textColor = isDark ? '#F9FAFB' : '#111827';
            const mutedTextColor = isDark ? '#D1D5DB' : '#6B7280';
            const lowColor = isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.15)';
            const highColor = isDark ? 'rgba(59, 130, 246, 0.85)' : 'rgba(37, 99, 235, 0.7)';
            const borderColor = isDark ? '#4B5563' : '#D1D5DB';
            
            return (
              <>
                <text x={0} y={0} fontSize="13" fill={textColor} fontWeight="600" className="text-sm font-semibold">
                  Intensity
                </text>
                <rect x={0} y={15} width={20} height={10} fill={lowColor} stroke={borderColor} strokeWidth="1" rx="3" />
                <text x={25} y={23} fontSize="11" fill={mutedTextColor} className="text-xs">Low</text>
                <rect x={0} y={30} width={20} height={10} fill={highColor} stroke={borderColor} strokeWidth="1" rx="3" />
                <text x={25} y={38} fontSize="11" fill={mutedTextColor} className="text-xs">High</text>
              </>
            );
          })()}
        </g>
        </svg>
      </div>
    </div>
  );
});

HeatMapComponent.displayName = 'HeatMapComponent';