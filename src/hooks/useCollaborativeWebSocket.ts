'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { CollaborativeUser, FilterState } from '@/types/analytics';

interface CollaborativeMessage {
  type: 'user-join' | 'user-leave' | 'cursor-move' | 'filter-change' | 'presence-update' | 'sync-request' | 'sync-response';
  payload: Record<string, unknown>;
  userId: string;
  timestamp: string;
  sessionId: string;
}

interface UseCollaborativeWebSocketProps {
  enabled: boolean;
  sessionId?: string;
  userId: string;
  userName: string;
}

export const useCollaborativeWebSocket = ({
  enabled,
  sessionId,
  userId,
  userName
}: UseCollaborativeWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const {
    addCollaborativeUser,
    removeCollaborativeUser,
    updateUserCursor,
    setCurrentUser,
    updateFilters,
    filters
  } = useDashboardStore();

  const sendMessage = useCallback((message: Omit<CollaborativeMessage, 'userId' | 'timestamp' | 'sessionId'>) => {
    if (ws.current?.readyState === WebSocket.OPEN && sessionId) {
      const fullMessage: CollaborativeMessage = {
        ...message,
        userId,
        timestamp: new Date().toISOString(),
        sessionId
      };
      ws.current.send(JSON.stringify(fullMessage));
    }
  }, [userId, sessionId]);

  // Send cursor updates (throttled)
  const sendCursorUpdate = useCallback((x: number, y: number, elementId?: string) => {
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }
    
    cursorUpdateTimeoutRef.current = setTimeout(() => {
      sendMessage({
        type: 'cursor-move',
        payload: { x, y, elementId }
      });
    }, 50); // Throttle to 20fps
  }, [sendMessage]);

  // Send filter changes
  const sendFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    sendMessage({
      type: 'filter-change',
      payload: newFilters
    });
  }, [sendMessage]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: CollaborativeMessage = JSON.parse(event.data);
      console.log('Received collaborative message:', message);
      
      // Ignore messages from self or different sessions
      if (message.userId === userId || message.sessionId !== sessionId) {
        console.log('Ignoring message:', { 
          fromSelf: message.userId === userId, 
          differentSession: message.sessionId !== sessionId,
          messageUserId: message.userId,
          currentUserId: userId,
          messageSessionId: message.sessionId,
          currentSessionId: sessionId
        });
        return;
      }

      console.log('Processing collaborative message:', message.type);
      switch (message.type) {
        case 'user-join':
          addCollaborativeUser({
            id: message.userId,
            name: message.payload.name,
            avatar: message.payload.avatar,
            joinedAt: message.timestamp,
            lastActivity: message.timestamp
          });
          break;

        case 'user-leave':
          removeCollaborativeUser(message.userId);
          break;

        case 'cursor-move':
          updateUserCursor(message.userId, message.payload);
          break;

        case 'filter-change':
          updateFilters(message.payload);
          break;

        case 'presence-update':
          addCollaborativeUser({
            id: message.userId,
            name: message.payload.name,
            avatar: message.payload.avatar,
            joinedAt: message.payload.joinedAt,
            lastActivity: message.timestamp
          });
          break;

        case 'sync-request':
          // Send current state to new user
          sendMessage({
            type: 'sync-response',
            payload: {
              filters,
              users: [] // Will be populated by server
            }
          });
          break;

        case 'sync-response':
          // Apply synchronized state
          if (message.payload.filters) {
            updateFilters(message.payload.filters);
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing collaborative message:', error);
    }
  }, [userId, sessionId, addCollaborativeUser, removeCollaborativeUser, updateUserCursor, updateFilters, filters, sendMessage]);

  // Connect to collaborative WebSocket
  const connect = useCallback(() => {
    if (!enabled || !sessionId) {
      console.log('Collaborative WebSocket not connecting:', { enabled, sessionId });
      return;
    }

    // Use the same WebSocket endpoint but with query parameters for collaboration
    const collaborativeURL = `ws://localhost:8080?sessionId=${sessionId}&userId=${userId}&userName=${encodeURIComponent(userName)}`;
    console.log('Connecting to collaborative WebSocket:', collaborativeURL);
    
    try {
      ws.current = new WebSocket(collaborativeURL);

      ws.current.onopen = () => {
        console.log('Collaborative WebSocket connected successfully');
        
        // Set current user
        setCurrentUser({
          id: userId,
          name: userName,
          joinedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        });

        // Announce joining
        sendMessage({
          type: 'user-join',
          payload: { name: userName }
        });

        // Request sync with existing users
        sendMessage({
          type: 'sync-request',
          payload: {}
        });
      };

      ws.current.onmessage = handleMessage;

      ws.current.onclose = (event) => {
        console.log('Collaborative WebSocket disconnected:', event.code);
        
        // Attempt reconnection if not intentional
        if (event.code !== 1000 && enabled && sessionId) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('Collaborative WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to collaborative WebSocket:', error);
    }
  }, [enabled, sessionId, userId, userName, handleMessage, sendMessage, setCurrentUser]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (ws.current) {
      // Announce leaving
      sendMessage({
        type: 'user-leave',
        payload: {}
      });
      
      ws.current.close(1000, 'User disconnected');
      ws.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }
  }, [sendMessage]);

  // Set up mouse tracking when collaborative session is active
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const handleMouseMove = (event: MouseEvent) => {
      const elementId = (event.target as HTMLElement)?.id || undefined;
      sendCursorUpdate(event.clientX, event.clientY, elementId);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [enabled, sessionId, sendCursorUpdate]);

  // Connect/disconnect based on enabled state
  useEffect(() => {
    if (enabled && sessionId) {
      connect();
    } else {
      disconnect();
    }

    return disconnect;
  }, [enabled, sessionId, connect, disconnect]);

  return {
    sendMessage,
    sendFilterChange,
    connected: ws.current?.readyState === WebSocket.OPEN
  };
};