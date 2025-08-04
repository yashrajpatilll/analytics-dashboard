'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

interface AISummaryToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export const AISummaryToggle: React.FC<AISummaryToggleProps> = ({
  isEnabled,
  onToggle,
  className = ''
}) => {
  return (
    <Button
      onClick={() => onToggle(!isEnabled)}
      variant={isEnabled ? 'default' : 'outline'}
      size="sm"
      className={`flex items-center gap-2 ${className}`}
    >
      <Sparkles className="w-4 h-4" />
      <span className="hidden sm:inline">AI Summary</span>
      <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1.5 py-0.5 rounded">
        Beta
      </span>
      {isEnabled ? (
        <Eye className="w-3 h-3" />
      ) : (
        <EyeOff className="w-3 h-3" />
      )}
    </Button>
  );
};