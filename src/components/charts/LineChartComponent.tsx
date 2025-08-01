import React, { memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/hooks/useTheme';

interface LineChartComponentProps {
  data: Array<{
    time: string;
    [key: string]: string | number;
  }>;
  dataKey: string;
  stroke?: string;
  height?: number;
}

export const LineChartComponent = memo(({
  data,
  dataKey,
  height = 300
}: LineChartComponentProps) => {
  const { isDark, mounted } = useTheme();

  // Use hardcoded theme colors that match the CSS variables
  const lightColors = {
    chartColor: '#0055FF', // matches --chart-1 in light mode
    gridColor: '#D1D5DB',
    textColor: '#6B7280',
    bgColor: '#FFFFFF'
  };

  const darkColors = {
    chartColor: '#0A84FF', // matches --chart-1 in dark mode  
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
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop 
              offset="5%" 
              stopColor={colors.chartColor} 
              stopOpacity={isDark ? 0.6 : 0.8}
            />
            <stop 
              offset="95%" 
              stopColor={colors.chartColor} 
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={colors.gridColor}
          opacity={0.3}
        />
        <XAxis 
          dataKey="time" 
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
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={colors.chartColor}
          strokeWidth={2.5}
          fill="url(#colorGradient)"
          dot={false}
          activeDot={{ r: 5, fill: colors.chartColor, strokeWidth: 2, stroke: colors.bgColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

LineChartComponent.displayName = 'LineChartComponent';