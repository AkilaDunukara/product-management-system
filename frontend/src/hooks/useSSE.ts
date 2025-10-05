import { useState, useEffect, useCallback } from 'react';
import { createSSEConnection } from '../services/api';
import { env } from '../config/env';
import type { SSEEvent, Notification } from '../types';

interface UseSSEOptions {
  maxNotifications?: number;
  onError?: (error: Event) => void;
}

interface UseSSEReturn {
  notifications: Notification[];
  connected: boolean;
  clearNotifications: () => void;
}

export const useSSE = (
  sellerId: string | null,
  options: UseSSEOptions = {}
): UseSSEReturn => {
  const { maxNotifications = env.sse.maxNotifications, onError } = options;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sellerId) return;

    let eventSource: EventSource | undefined;

    const handleMessage = (data: SSEEvent) => {
      const notification: Notification = {
        id: data.id || Date.now(),
        type: (data.type || data.eventType || 'info') as Notification['type'],
        message: data.message || 'New notification',
        data: data.data || {},
        timestamp: data.timestamp || Date.now()
      };

      setNotifications((prev) => [notification, ...prev].slice(0, maxNotifications));
    };

    const handleError = (error: Event) => {
      console.error('SSE Error:', error);
      setConnected(false);
      if (onError) onError(error);
    };

    try {
      eventSource = createSSEConnection(sellerId, handleMessage, handleError);
      setConnected(true);
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      setConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        setConnected(false);
      }
    };
  }, [sellerId, maxNotifications, onError]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, connected, clearNotifications };
};
