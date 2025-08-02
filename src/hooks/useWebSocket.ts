import { useEffect, useRef, useCallback, useState } from 'react';
import { AnalyticsDataPoint } from '@/types/analytics';

interface UseWebSocketProps {
  url: string;
  onMessage: (data: AnalyticsDataPoint) => void;
  onError?: (error: Event) => void;
  onConnectionChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enabled?: boolean;
}

export const useWebSocket = ({
  url,
  onMessage,
  onError,
  onConnectionChange,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  enabled = true
}: UseWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false); // Prevent concurrent connections
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    // Don't connect if disabled
    if (!enabled) {
      console.log(`🚫 Analytics WebSocket connection to ${url} is disabled`);
      return;
    }

    // Prevent concurrent connection attempts
    if (isConnectingRef.current || ws.current?.readyState === WebSocket.CONNECTING) {
      console.log(`⏳ WebSocket connection to ${url} already in progress`);
      return;
    }

    // Additional check: Don't connect if we already have a connected WebSocket
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log(`✅ WebSocket to ${url} already connected`);
      return;
    }

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
      console.log(`🔗 Attempting WebSocket connection to ${url}`);
      isConnectingRef.current = true;
      setConnectionStatus('connecting');
      onConnectionChange?.('connecting');
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log(`✅ WebSocket connected to ${url}`);
        isConnectingRef.current = false;
        setConnectionStatus('connected');
        onConnectionChange?.('connected');
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);
      };

      ws.current.onmessage = (event) => {
        try {
          const data: AnalyticsDataPoint = JSON.parse(event.data);
          // Process immediately for real-time updates
          onMessage(data);
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
                               event.code !== 1005 && // Don't reconnect on network interruption - often indicates client issues
                               event.code !== 1008 && // Don't reconnect on policy violations
                               reconnectAttemptsRef.current < maxReconnectAttempts;
        
        console.log(`🔌 WebSocket close event:`, {
          code: event.code,
          reason: closeReason,
          shouldReconnect,
          reconnectAttempts: reconnectAttemptsRef.current,
          maxAttempts: maxReconnectAttempts
        });
        
        if (isNormalClose) {
          console.log(`WebSocket disconnected normally from ${url}`);
        } else if (event.code === 1006) {
          console.warn(`WebSocket connection lost unexpectedly from ${url} - likely server unavailable`);
        } else {
          console.warn(`WebSocket disconnected from ${url}: ${closeReason}`);
        }
        
        isConnectingRef.current = false;
        setConnectionStatus('disconnected');
        onConnectionChange?.('disconnected');
        
        // Attempt reconnection based on close code
        if (shouldReconnect) {
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            setReconnectAttempts(reconnectAttemptsRef.current);
            onConnectionChange?.('connecting');
            // Use a stable reference to avoid infinite loops
            setTimeout(() => connect(), 0);
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
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
        isConnectingRef.current = false;
        setConnectionStatus('error');
        onConnectionChange?.('error');
        onError?.(error);
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to create WebSocket connection to ${url}: ${errorMessage}`);
      isConnectingRef.current = false;
      setConnectionStatus('error');
      onConnectionChange?.('error');
    }
  }, [url, onMessage, onError, onConnectionChange, reconnectInterval, maxReconnectAttempts, enabled]); // Add enabled to dependencies

  const disconnect = useCallback(() => {
    console.log(`🔌 Disconnecting WebSocket from ${url}`);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    isConnectingRef.current = false;
    setConnectionStatus('disconnected');
  }, [url]);

  useEffect(() => {
    console.log(`🔄 Analytics WebSocket useEffect triggered:`, { enabled, url });
    
    // Add a small delay to prevent rapid state changes
    const timeoutId = setTimeout(() => {
      if (enabled) {
        connect();
      } else {
        disconnect();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      disconnect();
    };
  }, [enabled, connect, disconnect, url]);

  return {
    connectionStatus,
    reconnectAttempts,
    disconnect,
    reconnect: connect
  };
};