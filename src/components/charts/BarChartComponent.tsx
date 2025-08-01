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

  // Use hardcoded theme colors that match the CSS variables
  const lightColors = {
    chartColor: '#34C759', // matches --chart-2 in light mode (green)
    gridColor: '#D1D5DB',
    textColor: '#6B7280',
    bgColor: '#F3F4F6'
  };

  const darkColors = {
    chartColor: '#30D158', // matches --chart-2 in dark mode (green)
    gridColor: '#374151',
    textColor: '#9CA3AF',
    bgColor: '#1F2937'
  };

  const colors = isDark ? darkColors : lightColors;

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
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={colors.gridColor}
          opacity={0.3}
        />
        <XAxis 
          dataKey={xAxisKey} 
          stroke={colors.textColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke={colors.textColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.bgColor,
            border: `1px solid ${colors.gridColor}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}
          labelStyle={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
        />
        <Bar 
          dataKey={yAxisKey} 
          fill={colors.chartColor}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

BarChartComponent.displayName = 'BarChartComponent';