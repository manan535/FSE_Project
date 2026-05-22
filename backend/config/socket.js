import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const onlineUsers = new Map(); // userId -> Set of socketIds

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000
  });

  // JWT Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected: ${socket.user.name} (${userId})`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user-specific room for DM notifications
    socket.join(`user:${userId}`);

    // Join workspace room
    socket.on('join_workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      // Broadcast online status to workspace members
      socket.to(`workspace:${workspaceId}`).emit('online_status', {
        userId,
        isOnline: true
      });
      console.log(`📌 ${socket.user.name} joined workspace: ${workspaceId}`);
    });

    // Leave workspace room
    socket.on('leave_workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    // Join chat room
    socket.on('join_chat', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`💬 ${socket.user.name} joined chat: ${chatId}`);
    });

    // Leave chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // Typing indicator
    socket.on('typing', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing_indicator', {
        chatId,
        userId,
        userName: socket.user.name
      });
    });

    // Stop typing
    socket.on('stop_typing', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing_stopped', {
        chatId,
        userId
      });
    });

    // Get online users list
    socket.on('get_online_users', (callback) => {
      const onlineUserIds = Array.from(onlineUsers.keys());
      if (typeof callback === 'function') {
        callback(onlineUserIds);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.name}`);

      // Remove socket from online users
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);

          // Broadcast offline status to all rooms this socket was in
          io.emit('online_status', {
            userId,
            isOnline: false
          });
        }
      }
    });
  });

  return io;
};

export { onlineUsers };
export default initializeSocket;
