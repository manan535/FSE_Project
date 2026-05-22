import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import useChatStore from '../store/chatStore';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const ChatSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuth();;
  const { currentWorkspace } = useWorkspace();

  // Pull individual store actions (stable function references — never stale)
  const addMessage    = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const updateChat    = useChatStore((s) => s.updateChat);
  const addChat       = useChatStore((s) => s.addChat);
  const setTyping     = useChatStore((s) => s.setTyping);
  const bumpUnread    = useChatStore((s) => s.bumpUnread);
  const setUserOnline = useChatStore((s) => s.setUserOnline);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect – use window.location.origin so the Vite /socket.io proxy is
    // used in dev and the same origin is used in production.
    socketRef.current = io(window.location.origin, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // ── Online presence ──────────────────────────────────────────────────────
    socket.on('user:online', ({ userId, online }) => {
      setUserOnline(userId, online);
    });

    // ── New message ──────────────────────────────────────────────────────────
    // addMessage in the store already checks whether the chat is active and
    // skips bumping unread if it is — no stale-closure risk here.
    socket.on('message:new', (message) => {
      addMessage(message);
    });

    // ── Message edited ───────────────────────────────────────────────────────
    socket.on('message:edited', (message) => {
      updateMessage(message);
    });

    // ── Message deleted ──────────────────────────────────────────────────────
    socket.on('message:deleted', ({ messageId }) => {
      removeMessage(messageId);
    });

    // ── Message reacted ──────────────────────────────────────────────────────
    socket.on('message:reacted', (message) => {
      updateMessage(message);
    });

    // ── Chat updated (latest message / timestamp) ────────────────────────────
    socket.on('chat:updated', (chat) => {
      updateChat(chat);
    });

    // ── New chat created by someone else ─────────────────────────────────────
    socket.on('chat:new', (chat) => {
      addChat(chat);
    });

    // ── Unread bump from server (sent to users NOT in the chat socket room) ──
    // Read activeChat via getState() to avoid the stale-closure problem that
    // occurs when this handler is set up once at connection time.
    socket.on('chat:unread', ({ chatId }) => {
      const activeChat = useChatStore.getState().activeChat;
      if (activeChat?._id !== chatId) {
        bumpUnread(chatId);
      }
    });

    // ── Typing ───────────────────────────────────────────────────────────────
    socket.on('typing:start', ({ userId, name, chatId }) => {
      setTyping(chatId, userId, name, true);
    });

    socket.on('typing:stop', ({ userId, chatId }) => {
      setTyping(chatId, userId, null, false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Join workspace room whenever the workspace changes ──────────────────────
  useEffect(() => {
    if (socketRef.current && currentWorkspace?._id) {
      socketRef.current.emit('workspace:join', currentWorkspace._id);
    }
  }, [currentWorkspace?._id]);

  // ── Socket action helpers ───────────────────────────────────────────────────
  const joinChat = (chatId) => {
    socketRef.current?.emit('chat:join', chatId);
  };

  const leaveChat = (chatId) => {
    socketRef.current?.emit('chat:leave', chatId);
  };

  const sendMessage = (chatId, content, workspaceId) => {
    socketRef.current?.emit('message:send', { chatId, content, workspaceId });
  };

  const startTyping = (chatId) => {
    socketRef.current?.emit('typing:start', { chatId });
  };

  const stopTyping = (chatId) => {
    socketRef.current?.emit('typing:stop', { chatId });
  };

  const editMessage = (chatId, messageId, content) => {
    socketRef.current?.emit('message:edit', { chatId, messageId, content });
  };

  const deleteMessage = (chatId, messageId) => {
    socketRef.current?.emit('message:delete', { chatId, messageId });
  };

  const reactToMessage = (chatId, messageId, emoji) => {
    socketRef.current?.emit('message:react', { chatId, messageId, emoji });
  };

  const markRead = (chatId) => {
    socketRef.current?.emit('chat:markRead', { chatId });
  };

  const notifyNewChat = (workspaceId, chat) => {
    socketRef.current?.emit('chat:created', { workspaceId, chat });
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        joinChat,
        leaveChat,
        sendMessage,
        startTyping,
        stopTyping,
        editMessage,
        deleteMessage,
        reactToMessage,
        markRead,
        notifyNewChat,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
