export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  replyTo?: string;
  edited?: boolean;
  editedAt?: Date;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileUrl?: string;
    imageUrl?: string;
  };
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  role: 'admin' | 'coach' | 'player' | 'parent';
  joinedAt: Date;
  lastSeen?: Date;
  isOnline: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'team' | 'coach-player';
  participants: ChatParticipant[];
  createdAt: Date;
  createdBy: string;
  lastMessage?: ChatMessage;
  lastActivity: Date;
  isActive: boolean;
  metadata?: {
    teamId?: string;
    coachId?: string;
    playerId?: string;
  };
}

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  currentRoom?: string;
}

export interface ChatNotification {
  id: string;
  userId: string;
  chatId: string;
  messageId: string;
  type: 'new_message' | 'mention' | 'reply';
  isRead: boolean;
  createdAt: Date;
}

export interface ChatPermissions {
  canSendMessages: boolean;
  canEditMessages: boolean;
  canDeleteMessages: boolean;
  canAddParticipants: boolean;
  canRemoveParticipants: boolean;
  canViewHistory: boolean;
}

export interface ChatContextType {
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  participants: ChatParticipant[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, type?: ChatMessage['type'], replyTo?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  permissions: ChatPermissions;
}

export interface ChatServiceConfig {
  firebaseConfig: any;
  encryptionKey?: string;
  maxMessageLength?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export type ChatEventType =
  | 'message_received'
  | 'message_updated'
  | 'message_deleted'
  | 'user_joined'
  | 'user_left'
  | 'presence_changed'
  | 'room_updated';

export interface ChatEvent {
  type: ChatEventType;
  roomId: string;
  data: any;
  timestamp: Date;
}