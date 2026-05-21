import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import useChatStore from '../store/chatStore';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [isConnected, setIsConnected] = useState(false);
  const prevWorkspaceRef = useRef(null);

  const {
    handleNewMessage,
    handleChatCreated,
    handleChatUpdated,
    handleTypingIndicator,
    handleTypingStopped,
    handleOnlineStatus,
    handleUnreadUpdate,
    handleMessageEdited,
    handleMessageDeleted,
    handleMessageReacted,
    handleMessagesRead
  } = useChatStore();

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io('http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    // Chat events
    socket.on('message_received', (message) => {
      handleNewMessage(message);
    });

    socket.on('chat_created', (chat) => {
      handleChatCreated(chat);
    });

    socket.on('chat_updated', (data) => {
      handleChatUpdated(data);
    });

    socket.on('typing_indicator', (data) => {
      handleTypingIndicator(data);
    });

    socket.on('typing_stopped', (data) => {
      handleTypingStopped(data);
    });

    socket.on('online_status', (data) => {
      handleOnlineStatus(data);
    });

    socket.on('unread_update', (data) => {
      handleUnreadUpdate(data);
    });

    socket.on('message_edited', (message) => {
      handleMessageEdited(message);
    });

    socket.on('message_deleted', (data) => {
      handleMessageDeleted(data);
    });

    socket.on('message_reacted', (data) => {
      handleMessageReacted(data);
    });

    socket.on('messages_read', (data) => {
      handleMessagesRead(data);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  // Join workspace room when workspace changes
  useEffect(() => {
    if (!socketRef.current || !isConnected || !currentWorkspace) return;

    // Leave previous workspace
    if (prevWorkspaceRef.current && prevWorkspaceRef.current !== currentWorkspace._id) {
      socketRef.current.emit('leave_workspace', prevWorkspaceRef.current);
    }

    socketRef.current.emit('join_workspace', currentWorkspace._id);
    prevWorkspaceRef.current = currentWorkspace._id;

    // Get initial online users
    socketRef.current.emit('get_online_users', (onlineUserIds) => {
      const { setOnlineUsers } = useChatStore.getState();
      setOnlineUsers(new Set(onlineUserIds));
    });
  }, [currentWorkspace, isConnected]);

  const joinChat = useCallback((chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_chat', chatId);
    }
  }, [isConnected]);

  const leaveChat = useCallback((chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_chat', chatId);
    }
  }, [isConnected]);

  const emitTyping = useCallback((chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', { chatId });
    }
  }, [isConnected]);

  const emitStopTyping = useCallback((chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stop_typing', { chatId });
    }
  }, [isConnected]);

  const value = {
    socket: socketRef.current,
    isConnected,
    joinChat,
    leaveChat,
    emitTyping,
    emitStopTyping
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
