'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StreamingTextState } from '@/types/ai';

interface UseStreamingTextOptions {
  speed?: number; // characters per interval (default: 2)
  interval?: number; // milliseconds between updates (default: 50)
  onComplete?: () => void;
}

export function useStreamingText(
  fullText: string,
  isActive: boolean = true,
  options: UseStreamingTextOptions = {}
) {
  const { speed = 2, interval = 50, onComplete } = options;
  
  const [state, setState] = useState<StreamingTextState>({
    displayedText: '',
    isStreaming: false,
    currentIndex: 0,
    speed
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(isActive);

  // Update active state ref
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const startStreaming = useCallback(() => {
    if (!fullText || !isActiveRef.current) return;

    setState(prev => ({
      ...prev,
      isStreaming: true,
      currentIndex: 0,
      displayedText: ''
    }));

    intervalRef.current = setInterval(() => {
      setState(prev => {
        const nextIndex = Math.min(prev.currentIndex + speed, fullText.length);
        const newDisplayedText = fullText.slice(0, nextIndex);
        
        if (nextIndex >= fullText.length) {
          // Streaming complete
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          onComplete?.();
          
          return {
            ...prev,
            displayedText: newDisplayedText,
            currentIndex: nextIndex,
            isStreaming: false
          };
        }

        return {
          ...prev,
          displayedText: newDisplayedText,
          currentIndex: nextIndex
        };
      });
    }, interval);
  }, [fullText, speed, interval, onComplete]);

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isStreaming: false,
      displayedText: fullText,
      currentIndex: fullText.length
    }));
  }, [fullText]);

  const resetStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      displayedText: '',
      isStreaming: false,
      currentIndex: 0
    }));
  }, []);

  // Start streaming when fullText changes and component is active
  useEffect(() => {
    if (fullText && isActive) {
      resetStreaming();
      // Small delay to allow for smooth transitions
      const timeout = setTimeout(startStreaming, 100);
      return () => clearTimeout(timeout);
    } else if (!isActive) {
      stopStreaming();
    }
  }, [fullText, isActive, startStreaming, stopStreaming, resetStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    displayedText: state.displayedText,
    isStreaming: state.isStreaming,
    progress: fullText.length > 0 ? state.currentIndex / fullText.length : 0,
    startStreaming,
    stopStreaming,
    resetStreaming
  };
}