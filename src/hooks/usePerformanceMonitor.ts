import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  memoryUsage: number;
  fps: number;
}

export const usePerformanceMonitor = (): PerformanceMetrics => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    fps: 0
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let isActive = true;
    
    const updateFPS = () => {
      if (!isActive) return;
      
      const now = performance.now();
      frameCountRef.current++;

      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        if (isActive) {
          setMetrics(prev => ({
            ...prev,
            fps
          }));
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      if (isActive) {
        animationIdRef.current = requestAnimationFrame(updateFPS);
      }
    };

    const updateMemoryUsage = () => {
      if (!isActive) return;
      
      if ('memory' in performance) {
        const memoryInfo = (performance as { memory?: { usedJSHeapSize: number } }).memory;
        if (memoryInfo && isActive) {
          const memoryUsage = Math.round(memoryInfo.usedJSHeapSize / 1048576); // Convert to MB
          
          setMetrics(prev => ({
            ...prev,
            memoryUsage
          }));
        }
      }
    };

    // Start FPS monitoring
    animationIdRef.current = requestAnimationFrame(updateFPS);

    // Start memory monitoring (every 5 seconds)
    const memoryInterval = setInterval(updateMemoryUsage, 5000);
    updateMemoryUsage(); // Initial reading

    return () => {
      isActive = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = undefined;
      }
      clearInterval(memoryInterval);
    };
  }, []);

  return metrics;
};