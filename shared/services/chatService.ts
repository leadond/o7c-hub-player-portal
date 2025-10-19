import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { handleApiError, ERROR_TYPES } from '../utils/errorHandler';
import type {
  ChatMessage,
  ChatRoom,
  ChatParticipant,
  UserPresence,
  ChatPermissions,
  ChatServiceConfig,
  ChatEvent,
} from '../types/chat';

export class ChatService {
  private config: ChatServiceConfig;
  private eventListeners: Map<string, (event: ChatEvent) => void> = new Map();

  constructor(config: ChatServiceConfig) {
    this.config = config;
  }

  // Room Management
  async createRoom(
    name: string,
    type: ChatRoom['type'],
    participants: string[],
    createdBy: string,
    metadata?: ChatRoom['metadata']
  ): Promise<string> {
    try {
      const roomData = {
        name,
        type,
        participants: participants.map(userId => ({
          userId,
          joinedAt: serverTimestamp(),
          isOnline: false,
        })),
        createdAt: serverTimestamp(),
        createdBy,
        lastActivity: serverTimestamp(),
        isActive: true,
        metadata: metadata || {},
      };

      const docRef = await addDoc(collection(db, 'chatRooms'), roomData);
      return docRef.id;
    } catch (error) {
      throw handleApiError(error, { operation: 'createRoom', context: 'ChatService' });
    }
  }

  async joinRoom(roomId: string, userId: string, userName: string, role: string): Promise<void> {
    try {
      const roomRef = doc(db, 'chatRooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        const error = new Error('Room not found');
        (error as any).status = 404;
        throw error;
      }

      const roomData = roomSnap.data();
      const participantIndex = roomData.participants.findIndex((p: any) => p.userId === userId);

      if (participantIndex === -1) {
        // Add new participant
        roomData.participants.push({
          userId,
          userName,
          role,
          joinedAt: serverTimestamp(),
          isOnline: true,
          lastSeen: serverTimestamp(),
        });
      } else {
        // Update existing participant
        roomData.participants[participantIndex].isOnline = true;
        roomData.participants[participantIndex].lastSeen = serverTimestamp();
      }

      await updateDoc(roomRef, {
        participants: roomData.participants,
        lastActivity: serverTimestamp(),
      });

      // Update user presence
      await this.updatePresence(userId, true, roomId);
    } catch (error) {
      throw handleApiError(error, { operation: 'joinRoom', roomId, context: 'ChatService' });
    }
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db, 'chatRooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return;
    }

    const roomData = roomSnap.data();
    const participantIndex = roomData.participants.findIndex((p: any) => p.userId === userId);

    if (participantIndex !== -1) {
      roomData.participants[participantIndex].isOnline = false;
      roomData.participants[participantIndex].lastSeen = serverTimestamp();

      await updateDoc(roomRef, {
        participants: roomData.participants,
        lastActivity: serverTimestamp(),
      });
    }

    // Update user presence
    await this.updatePresence(userId, false);
  }

  // Message Management
  async sendMessage(
    roomId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    replyTo?: string
  ): Promise<string> {
    const messageData = {
      chatId: roomId,
      senderId,
      senderName,
      content: this.encryptMessage(content),
      timestamp: serverTimestamp(),
      type,
      replyTo,
      edited: false,
    };

    const docRef = await addDoc(collection(db, 'chatMessages'), messageData);

    // Update room's last message and activity
    await updateDoc(doc(db, 'chatRooms', roomId), {
      lastMessage: {
        id: docRef.id,
        ...messageData,
        timestamp: serverTimestamp(),
      },
      lastActivity: serverTimestamp(),
    });

    return docRef.id;
  }

  async editMessage(messageId: string, content: string): Promise<void> {
    await updateDoc(doc(db, 'chatMessages', messageId), {
      content: this.encryptMessage(content),
      edited: true,
      editedAt: serverTimestamp(),
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    await deleteDoc(doc(db, 'chatMessages', messageId));
  }

  // File Upload
  async uploadFile(roomId: string, file: File, senderId: string): Promise<string> {
    if (this.config.maxFileSize && file.size > this.config.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`);
    }

    if (this.config.allowedFileTypes && !this.config.allowedFileTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    const fileRef = ref(storage, `chat/${roomId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  }

  // Real-time Subscriptions
  subscribeToRoom(roomId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      collection(db, 'chatMessages'),
      where('chatId', '==', roomId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        content: this.decryptMessage(doc.data().content),
      })) as ChatMessage[];

      callback(messages.reverse());
    });

    return unsubscribe;
  }

  subscribeToRoomUpdates(roomId: string, callback: (room: ChatRoom) => void): () => void {
    const unsubscribe = onSnapshot(doc(db, 'chatRooms', roomId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const room: ChatRoom = {
          id: snapshot.id,
          name: data.name,
          type: data.type,
          participants: data.participants || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy,
          lastActivity: data.lastActivity?.toDate() || new Date(),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
            content: this.decryptMessage(data.lastMessage.content),
          } : undefined,
          isActive: data.isActive,
          metadata: data.metadata,
        };
        callback(room);
      }
    });

    return unsubscribe;
  }

  subscribeToPresence(callback: (presences: UserPresence[]) => void): () => void {
    const unsubscribe = onSnapshot(collection(db, 'userPresence'), (snapshot) => {
      const presences = snapshot.docs.map(doc => ({
        ...doc.data(),
        lastSeen: doc.data().lastSeen?.toDate() || new Date(),
      })) as UserPresence[];
      callback(presences);
    });

    return unsubscribe;
  }

  // Presence Management
  private async updatePresence(userId: string, isOnline: boolean, currentRoom?: string): Promise<void> {
    const presenceRef = doc(db, 'userPresence', userId);
    await setDoc(presenceRef, {
      userId,
      isOnline,
      lastSeen: serverTimestamp(),
      currentRoom,
    }, { merge: true });
  }

  // Permissions
  async getPermissions(userId: string, roomId: string): Promise<ChatPermissions> {
    const roomSnap = await getDoc(doc(db, 'chatRooms', roomId));
    if (!roomSnap.exists()) {
      return {
        canSendMessages: false,
        canEditMessages: false,
        canDeleteMessages: false,
        canAddParticipants: false,
        canRemoveParticipants: false,
        canViewHistory: false,
      };
    }

    const room = roomSnap.data();
    const participant = room.participants.find((p: any) => p.userId === userId);

    if (!participant) {
      return {
        canSendMessages: false,
        canEditMessages: false,
        canDeleteMessages: false,
        canAddParticipants: false,
        canRemoveParticipants: false,
        canViewHistory: false,
      };
    }

    // Role-based permissions
    const isAdmin = participant.role === 'admin';
    const isCoach = participant.role === 'coach';
    const isPlayer = participant.role === 'player';
    const isParent = participant.role === 'parent';

    return {
      canSendMessages: true,
      canEditMessages: isAdmin || isCoach,
      canDeleteMessages: isAdmin,
      canAddParticipants: isAdmin || isCoach,
      canRemoveParticipants: isAdmin,
      canViewHistory: true,
    };
  }

  // Encryption/Decryption (basic implementation - enhance for production)
  private encryptMessage(content: string): string {
    if (!this.config.encryptionKey) return content;
    // Implement proper encryption here
    return btoa(content); // Base64 for now
  }

  private decryptMessage(content: string): string {
    if (!this.config.encryptionKey) return content;
    // Implement proper decryption here
    try {
      return atob(content); // Base64 for now
    } catch {
      return content;
    }
  }

  // Event System
  on(eventType: string, callback: (event: ChatEvent) => void): void {
    this.eventListeners.set(eventType, callback);
  }

  off(eventType: string): void {
    this.eventListeners.delete(eventType);
  }

  private emitEvent(event: ChatEvent): void {
    const listener = this.eventListeners.get(event.type);
    if (listener) {
      listener(event);
    }
  }

  // Cleanup
  async cleanupInactiveRooms(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, 'chatRooms'),
      where('lastActivity', '<', Timestamp.fromDate(thirtyDaysAgo)),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });

    await batch.commit();
  }
}