import { useEffect, useRef, useCallback, useState } from 'react';
import { AnalyticsDataPoint } from '@/types/analytics';

interface UseWebSocketProps {
  url: string;
  onMessage: (data: AnalyticsDataPoint) => void;
  onError?: (error: Event) => void;
  onConnectionChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = ({
  url,
  onMessage,
  onError,
  onConnectionChange,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: UseWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    // Clean up existing connection first
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    try {
      setConnectionStatus('connecting');
      onConnectionChange?.('connecting');
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log(`WebSocket connected to ${url}`);
        setConnectionStatus('connected');
        onConnectionChange?.('connected');
        setReconnectAttempts(0);
      };

      ws.current.onmessage = (event) => {
        try {
          const data: AnalyticsDataPoint = JSON.parse(event.data);
          // Use requestIdleCallback only if available, otherwise use direct call
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => {
              onMessage(data);
            }, { timeout: 100 });
          } else {
            onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        const getCloseReason = (code: number, reason: string) => {
          const codeReasons: Record<number, string> = {
            1000: 'Normal closure',
            1001: 'Going away (server shutdown or page navigation)',
            1002: 'Protocol error',
            1003: 'Unsupported data type',
            1005: 'No status received (network interruption)',
            1006: 'Abnormal closure (connection lost)',
            1007: 'Invalid frame payload data',
            1008: 'Policy violation',
            1009: 'Message too big',
            1010: 'Mandatory extension missing',
            1011: 'Internal server error',
            1012: 'Service restart',
            1013: 'Try again later (server overloaded)',
            1014: 'Bad gateway',
            1015: 'TLS handshake failure'
          };
          
          const defaultReason = codeReasons[code] || `Unknown close code: ${code}`;
          return reason || defaultReason;
        };

        const closeReason = getCloseReason(event.code, event.reason);
        const isNormalClose = event.code === 1000;
        const shouldReconnect = !isNormalClose && 
                               event.code !== 1001 && // Don't reconnect on intentional navigation/shutdown
                               event.code !== 1008 && // Don't reconnect on policy violations
                               reconnectAttempts < maxReconnectAttempts;
        
        if (isNormalClose) {
          console.log(`WebSocket disconnected normally from ${url}`);
        } else if (event.code === 1006) {
          console.warn(`WebSocket connection lost unexpectedly from ${url} - likely server unavailable`);
        } else {
          console.warn(`WebSocket disconnected from ${url}: ${closeReason}`);
        }
        
        setConnectionStatus('disconnected');
        onConnectionChange?.('disconnected');
        
        // Attempt reconnection based on close code
        if (shouldReconnect) {
          console.log(`Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            onConnectionChange?.('connecting');
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.warn(`Max reconnection attempts (${maxReconnectAttempts}) reached. Stopping reconnection.`);
        } else if (!shouldReconnect && !isNormalClose) {
          console.log(`Not attempting to reconnect due to close reason: ${closeReason}`);
        }
      };

      ws.current.onerror = (error) => {
        // More informative error logging
        const errorMessage = error instanceof Event 
          ? `WebSocket connection failed to ${url}` 
          : `WebSocket error: ${error}`;
        
        console.warn(errorMessage);
        setConnectionStatus('error');
        onConnectionChange?.('error');
        onError?.(error);
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to create WebSocket connection to ${url}: ${errorMessage}`);
      setConnectionStatus('error');
      onConnectionChange?.('error');
    }
  }, [url, onMessage, onError, onConnectionChange, reconnectInterval, maxReconnectAttempts, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    connectionStatus,
    reconnectAttempts,
    disconnect,
    reconnect: connect
  };
};