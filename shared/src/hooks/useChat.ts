import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/chatService';
import type {
  ChatMessage,
  ChatRoom,
  ChatParticipant,
  UserPresence,
  ChatPermissions,
  ChatContextType,
} from '../types/chat';

export const useChat = (chatService: ChatService, userId: string, userName: string, userRole: string) => {
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<ChatPermissions>({
    canSendMessages: false,
    canEditMessages: false,
    canDeleteMessages: false,
    canAddParticipants: false,
    canRemoveParticipants: false,
    canViewHistory: false,
  });

  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    type: ChatMessage['type'] = 'text',
    replyTo?: string
  ) => {
    if (!currentRoom || !permissions.canSendMessages) {
      throw new Error('Cannot send message');
    }

    try {
      setError(null);
      await chatService.sendMessage(currentRoom.id, userId, userName, content, type, replyTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [currentRoom, permissions.canSendMessages, userId, userName, chatService]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!permissions.canEditMessages) {
      throw new Error('Cannot edit message');
    }

    try {
      setError(null);
      await chatService.editMessage(messageId, content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message');
      throw err;
    }
  }, [permissions.canEditMessages, chatService]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!permissions.canDeleteMessages) {
      throw new Error('Cannot delete message');
    }

    try {
      setError(null);
      await chatService.deleteMessage(messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      throw err;
    }
  }, [permissions.canDeleteMessages, chatService]);

  // Join room
  const joinRoom = useCallback(async (roomId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Leave current room if any
      if (currentRoom) {
        await chatService.leaveRoom(currentRoom.id, userId);
      }

      // Join new room
      await chatService.joinRoom(roomId, userId, userName, userRole);

      // Update permissions
      const roomPermissions = await chatService.getPermissions(userId, roomId);
      setPermissions(roomPermissions);

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to join room');
      throw err;
    }
  }, [currentRoom, userId, userName, userRole, chatService]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!currentRoom) return;

    try {
      await chatService.leaveRoom(currentRoom.id, userId);
      setCurrentRoom(null);
      setMessages([]);
      setParticipants([]);
      setPermissions({
        canSendMessages: false,
        canEditMessages: false,
        canDeleteMessages: false,
        canAddParticipants: false,
        canRemoveParticipants: false,
        canViewHistory: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room');
    }
  }, [currentRoom, userId, chatService]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    // Implementation for pagination would go here
    // For now, this is a placeholder
  }, []);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    // Implementation for marking messages as read would go here
    // This could update a user's read status in the database
  }, []);

  // Set up subscriptions when room changes
  useEffect(() => {
    if (!currentRoom) return;

    // Clean up previous subscriptions
    unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    unsubscribeRefs.current = [];

    // Subscribe to messages
    const unsubscribeMessages = chatService.subscribeToRoom(currentRoom.id, (newMessages) => {
      setMessages(newMessages);
    });
    unsubscribeRefs.current.push(unsubscribeMessages);

    // Subscribe to room updates
    const unsubscribeRoom = chatService.subscribeToRoomUpdates(currentRoom.id, (room) => {
      setCurrentRoom(room);
      setParticipants(room.participants);
    });
    unsubscribeRefs.current.push(unsubscribeRoom);

    // Cleanup on unmount or room change
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [currentRoom, chatService]);

  // Leave room on unmount
  useEffect(() => {
    return () => {
      if (currentRoom) {
        chatService.leaveRoom(currentRoom.id, userId).catch(console.error);
      }
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    };
  }, [currentRoom, userId, chatService]);

  const contextValue: ChatContextType = {
    currentRoom,
    messages,
    participants,
    isLoading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    joinRoom,
    leaveRoom,
    loadMoreMessages,
    markAsRead,
    permissions,
  };

  return contextValue;
};