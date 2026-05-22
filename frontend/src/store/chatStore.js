import { create } from 'zustand';
import axios from 'axios';

const useChatStore = create((set, get) => ({
  // State
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: new Set(),
  typingUsers: {},
  unreadCounts: {},
  messagesLoading: false,
  chatsLoading: false,
  hasMoreMessages: true,
  nextCursor: null,

  // Setters
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  // Fetch all chats for the workspace
  fetchChats: async () => {
    set({ chatsLoading: true });
    try {
      const { data } = await axios.get('/api/chats');
      const unreadCounts = {};
      data.forEach(chat => {
        unreadCounts[chat._id] = chat.unreadCount || 0;
      });
      set({ chats: data, unreadCounts, chatsLoading: false });
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      set({ chatsLoading: false });
    }
  },

  // Fetch messages for a chat
  fetchMessages: async (chatId, cursor = null) => {
    set({ messagesLoading: true });
    try {
      const params = { limit: 50 };
      if (cursor) params.cursor = cursor;

      const { data } = await axios.get(`/api/messages/${chatId}`, { params });

      if (cursor) {
        // Prepend older messages
        set(state => ({
          messages: [...data.messages, ...state.messages],
          hasMoreMessages: data.hasMore,
          nextCursor: data.nextCursor,
          messagesLoading: false
        }));
      } else {
        set({
          messages: data.messages,
          hasMoreMessages: data.hasMore,
          nextCursor: data.nextCursor,
          messagesLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ messagesLoading: false });
    }
  },

  // Set active chat
  setActiveChat: (chat) => {
    set({
      activeChat: chat,
      messages: [],
      hasMoreMessages: true,
      nextCursor: null
    });
  },

  // Send a message
  sendMessage: async (chatId, content, attachments = []) => {
    try {
      const { data } = await axios.post('/api/messages', {
        chatId,
        content,
        attachments
      });
      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  // Create direct chat
  createDirectChat: async (userId) => {
    try {
      const { data } = await axios.post('/api/chats/direct', { userId });
      // Add to chats if not already there
      set(state => {
        const exists = state.chats.find(c => c._id === data._id);
        if (!exists) {
          return { chats: [data, ...state.chats] };
        }
        return {};
      });
      return data;
    } catch (error) {
      console.error('Failed to create direct chat:', error);
      throw error;
    }
  },

  // Create group chat
  createGroupChat: async (name, userIds) => {
    try {
      const { data } = await axios.post('/api/chats/group', { name, userIds });
      set(state => ({ chats: [data, ...state.chats] }));
      return data;
    } catch (error) {
      console.error('Failed to create group chat:', error);
      throw error;
    }
  },

  // Create group from project
  createGroupFromProject: async (projectId) => {
    try {
      const { data } = await axios.post('/api/chats/group/project', { projectId });
      set(state => {
        const exists = state.chats.find(c => c._id === data._id);
        if (!exists) {
          return { chats: [data, ...state.chats] };
        }
        return {};
      });
      return data;
    } catch (error) {
      console.error('Failed to create group chat from project:', error);
      throw error;
    }
  },

  // Mark as read
  markAsRead: async (chatId) => {
    try {
      await axios.put(`/api/messages/read/${chatId}`);
      set(state => ({
        unreadCounts: { ...state.unreadCounts, [chatId]: 0 }
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  // Pin chat
  pinChat: async (chatId) => {
    try {
      const { data } = await axios.put(`/api/chats/${chatId}/pin`);
      set(state => ({
        chats: state.chats.map(c =>
          c._id === chatId ? { ...c, _isPinned: data.pinned } : c
        )
      }));
    } catch (error) {
      console.error('Failed to pin chat:', error);
    }
  },

  // Edit message
  editMessage: async (messageId, content) => {
    try {
      const { data } = await axios.put(`/api/messages/${messageId}/edit`, { content });
      return data;
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      await axios.delete(`/api/messages/${messageId}`);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  },

  // Add reaction
  addReaction: async (messageId, emoji) => {
    try {
      const { data } = await axios.post(`/api/messages/${messageId}/react`, { emoji });
      return data;
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  },

  // Upload files
  uploadFiles: async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      const { data } = await axios.post('/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    } catch (error) {
      console.error('Failed to upload files:', error);
      throw error;
    }
  },

  // ============ SOCKET EVENT HANDLERS ============

  handleNewMessage: (message) => {
    set(state => {
      const isActiveChat = state.activeChat?._id === message.chat?._id || state.activeChat?._id === message.chat;

      // Update messages if this chat is active
      const newMessages = isActiveChat
        ? [...state.messages, message]
        : state.messages;

      // Update latest message in chat list
      const chatId = message.chat?._id || message.chat;
      const updatedChats = state.chats.map(c =>
        c._id === chatId
          ? { ...c, latestMessage: message, updatedAt: new Date().toISOString() }
          : c
      );

      // Sort chats by updatedAt
      updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return {
        messages: newMessages,
        chats: updatedChats
      };
    });
  },

  handleChatCreated: (chat) => {
    set(state => {
      const exists = state.chats.find(c => c._id === chat._id);
      if (!exists) {
        return { chats: [chat, ...state.chats] };
      }
      return {};
    });
  },

  handleChatUpdated: (data) => {
    set(state => {
      if (data.chatId) {
        const updatedChats = state.chats.map(c =>
          c._id === data.chatId
            ? { ...c, latestMessage: data.latestMessage, updatedAt: data.updatedAt }
            : c
        );
        updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return { chats: updatedChats };
      }
      // Full chat object update
      if (data._id) {
        return {
          chats: state.chats.map(c => c._id === data._id ? { ...c, ...data } : c)
        };
      }
      return {};
    });
  },

  handleTypingIndicator: ({ chatId, userId, userName }) => {
    set(state => {
      const chatTyping = state.typingUsers[chatId] || {};
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: { ...chatTyping, [userId]: userName }
        }
      };
    });

    // Auto-clear after 3 seconds
    setTimeout(() => {
      set(state => {
        const chatTyping = { ...(state.typingUsers[chatId] || {}) };
        delete chatTyping[userId];
        return {
          typingUsers: {
            ...state.typingUsers,
            [chatId]: chatTyping
          }
        };
      });
    }, 3000);
  },

  handleTypingStopped: ({ chatId, userId }) => {
    set(state => {
      const chatTyping = { ...(state.typingUsers[chatId] || {}) };
      delete chatTyping[userId];
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: chatTyping
        }
      };
    });
  },

  handleOnlineStatus: ({ userId, isOnline }) => {
    set(state => {
      const newOnlineUsers = new Set(state.onlineUsers);
      if (isOnline) {
        newOnlineUsers.add(userId);
      } else {
        newOnlineUsers.delete(userId);
      }
      return { onlineUsers: newOnlineUsers };
    });
  },

  handleUnreadUpdate: ({ chatId, increment }) => {
    set(state => {
      const currentCount = state.unreadCounts[chatId] || 0;
      // Don't increment if user is viewing this chat
      if (state.activeChat?._id === chatId) return {};
      return {
        unreadCounts: {
          ...state.unreadCounts,
          [chatId]: increment ? currentCount + 1 : 0
        }
      };
    });
  },

  handleMessageEdited: (message) => {
    set(state => ({
      messages: state.messages.map(m =>
        m._id === message._id ? { ...m, content: message.content, isEdited: true } : m
      )
    }));
  },

  handleMessageDeleted: ({ messageId }) => {
    set(state => ({
      messages: state.messages.map(m =>
        m._id === messageId ? { ...m, isDeleted: true, content: '', attachments: [] } : m
      )
    }));
  },

  handleMessageReacted: ({ messageId, reactions }) => {
    set(state => ({
      messages: state.messages.map(m =>
        m._id === messageId ? { ...m, reactions } : m
      )
    }));
  },

  handleMessagesRead: ({ chatId, userId }) => {
    set(state => ({
      messages: state.messages.map(m =>
        m.chat === chatId || m.chat?._id === chatId
          ? { ...m, readBy: [...new Set([...(m.readBy || []), userId])] }
          : m
      )
    }));
  },

  // Get total unread count for sidebar badge
  getTotalUnread: () => {
    const { unreadCounts } = get();
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }
}));

export default useChatStore;
