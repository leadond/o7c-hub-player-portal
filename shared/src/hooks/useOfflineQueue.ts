import { useState, useEffect, useCallback } from 'react';

interface QueuedMessage {
  id: string;
  roomId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  replyTo?: string;
  timestamp: number;
  retryCount: number;
}

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('chat_offline_queue');
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Failed to parse offline queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chat_offline_queue', JSON.stringify(queue));
  }, [queue]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add message to queue
  const addToQueue = useCallback((
    roomId: string,
    content: string,
    type: QueuedMessage['type'] = 'text',
    replyTo?: string
  ) => {
    const queuedMessage: QueuedMessage = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      content,
      type,
      replyTo,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setQueue(prev => [...prev, queuedMessage]);
    return queuedMessage.id;
  }, []);

  // Remove message from queue
  const removeFromQueue = useCallback((messageId: string) => {
    setQueue(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Retry sending a message
  const retryMessage = useCallback((messageId: string) => {
    setQueue(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, retryCount: msg.retryCount + 1 }
        : msg
    ));
  }, []);

  // Clear old messages (older than 24 hours)
  const clearOldMessages = useCallback(() => {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    setQueue(prev => prev.filter(msg => msg.timestamp > oneDayAgo));
  }, []);

  // Get messages for a specific room
  const getQueuedMessagesForRoom = useCallback((roomId: string) => {
    return queue.filter(msg => msg.roomId === roomId);
  }, [queue]);

  // Get all queued messages
  const getAllQueuedMessages = useCallback(() => {
    return queue;
  }, [queue]);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Get queue statistics
  const getQueueStats = useCallback(() => {
    return {
      total: queue.length,
      byRoom: queue.reduce((acc, msg) => {
        acc[msg.roomId] = (acc[msg.roomId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      failedRetries: queue.filter(msg => msg.retryCount >= 3).length,
    };
  }, [queue]);

  return {
    queue,
    isOnline,
    addToQueue,
    removeFromQueue,
    retryMessage,
    clearOldMessages,
    getQueuedMessagesForRoom,
    getAllQueuedMessages,
    clearQueue,
    getQueueStats,
  };
};