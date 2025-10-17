import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Reply, Edit2, Trash2, User, Users } from 'lucide-react';
import { ChatService } from '../services/chatService';
import { useChat, usePresence } from '../hooks';
import type { ChatMessage, ChatRoom } from '../types/chat';

interface ChatSystemProps {
  chatService: ChatService;
  userId: string;
  userName: string;
  userRole: string;
  roomId?: string;
  className?: string;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({
  chatService,
  userId,
  userName,
  userRole,
  roomId,
  className = '',
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chat = useChat(chatService, userId, userName, userRole);
  const presence = usePresence(chatService);

  // Auto-join room if provided
  useEffect(() => {
    if (roomId && !chat.currentRoom) {
      chat.joinRoom(roomId);
    }
  }, [roomId, chat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      if (editingMessage) {
        await chat.editMessage(editingMessage, messageInput);
        setEditingMessage(null);
      } else {
        await chat.sendMessage(messageInput, 'text', replyingTo || undefined);
        setReplyingTo(null);
      }
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileUrl = await chatService.uploadFile(chat.currentRoom!.id, file, userId);
      await chat.sendMessage(file.name, file.type.startsWith('image/') ? 'image' : 'file');
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return messageDate.toLocaleDateString();
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.senderId === userId;
    const prevMessage = index > 0 ? chat.messages[index - 1] : null;
    const showDateSeparator = !prevMessage ||
      formatDate(message.timestamp) !== formatDate(prevMessage.timestamp);

    return (
      <div key={message.id}>
        {showDateSeparator && (
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">
              {formatDate(message.timestamp)}
            </div>
          </div>
        )}

        <div className={`flex mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}>
            {!isOwnMessage && (
              <div className="text-xs font-semibold mb-1">{message.senderName}</div>
            )}

            {message.replyTo && (
              <div className="text-xs opacity-75 mb-2 border-l-2 border-current pl-2">
                Replying to: {chat.messages.find(m => m.id === message.replyTo)?.content.slice(0, 50)}...
              </div>
            )}

            {message.type === 'image' && message.metadata?.imageUrl && (
              <img
                src={message.metadata.imageUrl}
                alt={message.metadata.fileName}
                className="max-w-full rounded mb-2"
              />
            )}

            {message.type === 'file' && message.metadata?.fileUrl && (
              <a
                href={message.metadata.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 underline"
              >
                📎 {message.metadata.fileName}
              </a>
            )}

            <div className="text-sm">{message.content}</div>

            <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
              {formatTime(message.timestamp)}
              {message.edited && ' (edited)'}
            </div>
          </div>

          {isOwnMessage && chat.permissions.canEditMessages && (
            <div className="ml-2">
              <button
                onClick={() => {
                  setEditingMessage(message.id);
                  setMessageInput(message.content);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Edit2 size={14} />
              </button>
              {chat.permissions.canDeleteMessages && (
                <button
                  onClick={() => chat.deleteMessage(message.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}

          {!isOwnMessage && (
            <div className="ml-2">
              <button
                onClick={() => setReplyingTo(message.id)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Reply size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!chat.currentRoom) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <Users className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Chat Room Selected</h3>
          <p className="text-gray-600">Select a room to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <Users size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{chat.currentRoom.name}</h3>
            <p className="text-sm text-gray-600">
              {chat.participants.filter(p => p.isOnline).length} online
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowRoomSelector(!showRoomSelector)}
          className="text-gray-400 hover:text-gray-600"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {chat.messages.map((message, index) => renderMessage(message, index))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-100 border-t flex items-center justify-between">
          <div className="flex items-center">
            <Reply size={16} className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">
              Replying to: {chat.messages.find(m => m.id === replyingTo)?.content.slice(0, 50)}...
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-gray-600 p-2"
            disabled={!chat.permissions.canSendMessages}
          >
            <Paperclip size={20} />
          </button>

          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!chat.permissions.canSendMessages}
          />

          <button
            type="submit"
            disabled={!messageInput.trim() || !chat.permissions.canSendMessages}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      {/* Error Message */}
      {chat.error && (
        <div className="px-4 py-2 bg-red-100 border-t border-red-200">
          <p className="text-red-700 text-sm">{chat.error}</p>
        </div>
      )}
    </div>
  );
};