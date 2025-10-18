import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@o7c/shared';
import { Button } from '@o7c/shared';
import { useAuth } from '@o7c/shared';
import { MessageSquare, Send, Search, Filter, Star, Paperclip, MoreVertical } from 'lucide-react';

const Messages = () => {
  const { userData } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Mock conversations data
    setConversations([
      {
        id: 1,
        name: 'Coach Johnson',
        role: 'Head Coach',
        avatar: '/avatars/coach-johnson.jpg',
        lastMessage: 'Great practice today! Keep up the good work.',
        timestamp: '2024-01-15T14:30:00Z',
        unread: 2,
        online: true
      },
      {
        id: 2,
        name: 'UCLA Recruiting',
        role: 'College Recruiter',
        avatar: '/avatars/ucla.jpg',
        lastMessage: 'We would like to schedule a campus visit.',
        timestamp: '2024-01-15T10:15:00Z',
        unread: 1,
        online: false
      },
      {
        id: 3,
        name: 'Team Group',
        role: 'Team Chat',
        avatar: '/avatars/team.jpg',
        lastMessage: 'Sarah: Don\'t forget about tomorrow\'s game!',
        timestamp: '2024-01-14T18:45:00Z',
        unread: 5,
        online: true,
        isGroup: true
      },
      {
        id: 4,
        name: 'Dr. Smith',
        role: 'Team Doctor',
        avatar: '/avatars/doctor.jpg',
        lastMessage: 'Your injury report looks good. Cleared to play.',
        timestamp: '2024-01-14T16:20:00Z',
        unread: 0,
        online: false
      },
      {
        id: 5,
        name: 'Stanford Athletics',
        role: 'College Recruiter',
        avatar: '/avatars/stanford.jpg',
        lastMessage: 'Thank you for your interest in our program.',
        timestamp: '2024-01-13T11:30:00Z',
        unread: 0,
        online: false
      }
    ]);

    // Mock messages for selected conversation
    if (selectedConversation) {
      setMessages([
        {
          id: 1,
          senderId: selectedConversation.id,
          senderName: selectedConversation.name,
          content: 'Hi! How are you doing?',
          timestamp: '2024-01-15T10:00:00Z',
          isOwn: false
        },
        {
          id: 2,
          senderId: 'me',
          senderName: 'You',
          content: 'I\'m doing great! Thanks for asking.',
          timestamp: '2024-01-15T10:05:00Z',
          isOwn: true
        },
        {
          id: 3,
          senderId: selectedConversation.id,
          senderName: selectedConversation.name,
          content: selectedConversation.lastMessage,
          timestamp: selectedConversation.timestamp,
          isOwn: false
        }
      ]);
    }
  }, [selectedConversation]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      const message = {
        id: messages.length + 1,
        senderId: 'me',
        senderName: 'You',
        content: newMessage,
        timestamp: new Date().toISOString(),
        isOwn: true
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
            <Button size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              New
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <img
                      src={conversation.avatar}
                      alt={conversation.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <MessageSquare className="w-6 h-6 text-gray-400 hidden" />
                  </div>
                  {conversation.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(conversation.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-1">{conversation.role}</p>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unread > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Message Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <img
                        src={selectedConversation.avatar}
                        alt={selectedConversation.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <MessageSquare className="w-5 h-5 text-gray-400 hidden" />
                    </div>
                    {selectedConversation.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.online ? 'Online' : 'Offline'} • {selectedConversation.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;