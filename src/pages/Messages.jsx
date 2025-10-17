import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, ChatSystem } from '@o7c/shared';
import { MessageSquare, Send, User } from 'lucide-react';
import { ChatService, NotificationService } from '@o7c/shared';
import { chatServiceConfig } from '../config/chatConfig';
import { useAuth } from '@o7c/shared';

const Messages = () => {
  const { user, userData } = useAuth();
  const [chatService, setChatService] = useState(null);
  const [notificationService, setNotificationService] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('player-general');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userData) return;

    // Initialize chat service
    const service = new ChatService(chatServiceConfig);
    setChatService(service);

    // Initialize notification service
    const notifService = new NotificationService(user.uid);
    setNotificationService(notifService);

    // Load user's chat rooms
    loadUserRooms(service);

    return () => {
      // Cleanup subscriptions
    };
  }, [user, userData]);

  const loadUserRooms = async (service) => {
    try {
      // For player portal, create or join player-specific rooms
      // This would typically fetch rooms the player has access to
      setLoading(false);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!chatService || !user || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Unable to load chat. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Team Chat</h1>
      <p className="text-gray-600">Communicate with your coaches and team members</p>

      <Card className="h-[600px]">
        <ChatSystem
          chatService={chatService}
          userId={user.uid}
          userName={userData.firstName + ' ' + userData.lastName || user.email}
          userRole={userData.role}
          roomId={selectedRoomId}
          className="h-full"
        />
      </Card>
    </div>
  );
};

export default Messages;