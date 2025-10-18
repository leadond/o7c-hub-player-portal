import { useState, useEffect, useCallback } from 'react';
import { ChatService } from '../services/chatService';
import type { UserPresence } from '../types/chat';

export const usePresence = (chatService: ChatService) => {
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = chatService.subscribeToPresence((newPresences) => {
      setPresences(newPresences);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [chatService]);

  const getPresenceByUserId = useCallback((userId: string): UserPresence | undefined => {
    return presences.find(p => p.userId === userId);
  }, [presences]);

  const getOnlineUsers = useCallback((): UserPresence[] => {
    return presences.filter(p => p.isOnline);
  }, [presences]);

  const getUsersInRoom = useCallback((roomId: string): UserPresence[] => {
    return presences.filter(p => p.isOnline && p.currentRoom === roomId);
  }, [presences]);

  return {
    presences,
    isLoading,
    getPresenceByUserId,
    getOnlineUsers,
    getUsersInRoom,
  };
};