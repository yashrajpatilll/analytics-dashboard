import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/hooks/useTheme';

interface BarChartComponentProps {
  data: Array<{
    [key: string]: string | number;
  }>;
  xAxisKey: string;
  yAxisKey: string;
  fill?: string;
  height?: number;
}

export const BarChartComponent = memo(({
  data,
  xAxisKey,
  yAxisKey,
  height = 300
}: BarChartComponentProps) => {
  const { isDark, mounted } = useTheme();

  // Use colors that work with the current theme
  const colors = {
    chartColor: isDark ? '#c0a080' : '#a67c52', // primary colors from globals.css
    gridColor: isDark ? '#4a4039' : '#dbd0ba',   // border colors  
    textColor: isDark ? '#c5bcac' : '#7d6b56',   // muted-foreground colors
    bgColor: isDark ? '#3a322c' : '#fffcf5'      // background colors
  };

  // Validate that we have data with valid Y values
  const hasValidData = data.some(d => d[yAxisKey] != null && Number(d[yAxisKey]) > 0);
  if (!hasValidData) {
    console.log('📊 BarChart: No valid data for yAxisKey:', yAxisKey);
  }

  // Validate data
  if (!data || data.length === 0) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-muted-foreground">No data available</div>
        </div>
      </ResponsiveContainer>
    );
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={colors.gridColor}
          opacity={0.3}
        />
        <XAxis 
          dataKey={xAxisKey} 
          stroke={colors.textColor}
          fontSize={9}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 9 }}
        />
        <YAxis 
          stroke={colors.textColor}
          fontSize={10}
          tickLine={false}
          axisLine={false}
          width={40}
          domain={['dataMin', 'dataMax']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.bgColor,
            border: `1px solid ${colors.gridColor}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}
          labelStyle={{ color: colors.textColor }}
        />
        <Bar 
          dataKey={yAxisKey} 
          fill={colors.chartColor}
          stroke={colors.chartColor}
          strokeWidth={1}
          radius={[6, 6, 0, 0]}
          minPointSize={5}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

BarChartComponent.displayName = 'BarChartComponent';