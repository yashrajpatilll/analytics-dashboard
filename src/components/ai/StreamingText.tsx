'use client';

import React from 'react';
import { useStreamingText } from '@/hooks/useStreamingText';

interface StreamingTextProps {
  text: string;
  isActive?: boolean;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  showCursor?: boolean;
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  isActive = true,
  speed = 2,
  className = '',
  onComplete,
  showCursor = true
}) => {
  const { displayedText, isStreaming } = useStreamingText(text, isActive, {
    speed,
    interval: 50,
    onComplete
  });

  return (
    <span className={className}>
      {displayedText}
      {showCursor && isStreaming && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse" />
      )}
    </span>
  );
};