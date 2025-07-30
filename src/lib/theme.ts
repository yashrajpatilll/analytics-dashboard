export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    card: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
  };
  
  // Status colors
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  
  // Chart colors
  chart: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
  };
}

export const lightTheme: ThemeColors = {
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    card: '#ffffff',
  },
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#6b7280',
    inverse: '#ffffff',
  },
  border: {
    primary: '#e5e7eb',
    secondary: '#d1d5db',
  },
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  chart: {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    accent: '#8b5cf6',
  },
};

export const darkTheme: ThemeColors = {
  background: {
    primary: '#111827',
    secondary: '#1f2937',
    tertiary: '#374151',
    card: '#1f2937',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#d1d5db',
    tertiary: '#9ca3af',
    inverse: '#111827',
  },
  border: {
    primary: '#374151',
    secondary: '#4b5563',
  },
  status: {
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
  chart: {
    primary: '#60a5fa',
    secondary: '#34d399',
    tertiary: '#fbbf24',
    accent: '#a78bfa',
  },
};

export type ThemeMode = 'light' | 'dark';