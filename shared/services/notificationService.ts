import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ChatNotification } from '../types/chat';

export class NotificationService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Create notification
  async createNotification(
    chatId: string,
    messageId: string,
    type: ChatNotification['type'],
    fromUserId: string
  ): Promise<void> {
    // Don't create notification for own messages
    if (fromUserId === this.userId) return;

    const notificationData = {
      userId: this.userId,
      chatId,
      messageId,
      type,
      isRead: false,
      createdAt: new Date(),
    };

    await addDoc(collection(db, 'chatNotifications'), notificationData);
  }

  // Get notifications
  subscribeToNotifications(callback: (notifications: ChatNotification[]) => void): () => void {
    const q = query(
      collection(db, 'chatNotifications'),
      where('userId', '==', this.userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as ChatNotification[];
      callback(notifications);
    });

    return unsubscribe;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'chatNotifications', notificationId), {
      isRead: true,
    });
  }

  // Mark all notifications as read for a chat
  async markChatAsRead(chatId: string): Promise<void> {
    const q = query(
      collection(db, 'chatNotifications'),
      where('userId', '==', this.userId),
      where('chatId', '==', chatId),
      where('isRead', '==', false)
    );

    // Get the documents first
    const querySnapshot = await getDocs(q);
    const updatePromises: Promise<void>[] = [];

    querySnapshot.forEach((document) => {
      updatePromises.push(updateDoc(document.ref, { isRead: true }));
    });

    await Promise.all(updatePromises);
  }

  // Get unread count
  subscribeToUnreadCount(callback: (count: number) => void): () => void {
    const q = query(
      collection(db, 'chatNotifications'),
      where('userId', '==', this.userId),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });

    return unsubscribe;
  }

  // Browser notification (if permission granted)
  async showBrowserNotification(title: string, body: string, chatId: string): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/o7clogo.png', // Update with your app icon
        tag: chatId, // Prevents duplicate notifications
      });

      notification.onclick = () => {
        // Focus on chat window/tab
        window.focus();
        // Navigate to chat
        notification.close();
      };
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}