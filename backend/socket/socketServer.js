import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

// Track online users: userId → socketId
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  // ─── Auth Middleware ───────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed: ' + err.message));
    }
  });

  // ─── Connection ────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] ${socket.user.name} connected (${socket.id})`);

    // Register online
    onlineUsers.set(userId, socket.id);
    io.emit('user:online', { userId, online: true });

    // ── Join workspace room ──────────────────────────────────────────────────
    socket.on('workspace:join', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`[Socket] ${socket.user.name} joined workspace:${workspaceId}`);
    });

    // ── Join chat room ───────────────────────────────────────────────────────
    socket.on('chat:join', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;
        const isMember = chat.participants.some((p) => p.toString() === userId);
        if (!isMember) return;
        socket.join(`chat:${chatId}`);
        console.log(`[Socket] ${socket.user.name} joined chat:${chatId}`);
      } catch (err) {
        console.error('[Socket] chat:join error:', err.message);
      }
    });

    // ── Leave chat room ──────────────────────────────────────────────────────
    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // ── Send message via socket ──────────────────────────────────────────────
    socket.on('message:send', async ({ chatId, content, workspaceId }) => {
      try {
        if (!content?.trim()) return;

        const chat = await Chat.findById(chatId);
        if (!chat) return;
        if (chat.workspaceId.toString() !== workspaceId) return;

        const isMember = chat.participants.some((p) => p.toString() === userId);
        if (!isMember) return;

        let message = await Message.create({
          sender: userId,
          content: content.trim(),
          chatId,
          readBy: [userId],
        });

        await Chat.findByIdAndUpdate(chatId, {
          latestMessage: message._id,
          updatedAt: new Date(),
        });

        message = await Message.findById(message._id).populate(
          'sender',
          'name avatar email'
        );

        // Emit message to everyone in chat room
        io.to(`chat:${chatId}`).emit('message:new', message);

        // Notify workspace sidebar for all participants
        const updatedChat = await Chat.findById(chatId)
          .populate('participants', 'name avatar email')
          .populate({ path: 'latestMessage', populate: { path: 'sender', select: 'name avatar' } });

        io.to(`workspace:${workspaceId}`).emit('chat:updated', updatedChat);

        // Unread count bump for offline participants
        chat.participants.forEach((participantId) => {
          const pid = participantId.toString();
          if (pid !== userId) {
            const participantSocket = onlineUsers.get(pid);
            if (participantSocket) {
              io.to(participantSocket).emit('chat:unread', {
                chatId,
                senderId: userId,
              });
            }
          }
        });
      } catch (err) {
        console.error('[Socket] message:send error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    // ── Typing indicator ─────────────────────────────────────────────────────
    socket.on('typing:start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:start', {
        userId,
        name: socket.user.name,
        chatId,
      });
    });

    socket.on('typing:stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', { userId, chatId });
    });

    // ── Edit message ─────────────────────────────────────────────────────────
    socket.on('message:edit', async ({ chatId, messageId, content }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        if (message.sender.toString() !== userId) return;

        message.content = content.trim();
        message.isEdited = true;
        await message.save();

        const updated = await Message.findById(messageId).populate('sender', 'name avatar email');
        io.to(`chat:${chatId}`).emit('message:edited', updated);
      } catch (err) {
        console.error('[Socket] message:edit error:', err.message);
      }
    });

    // ── Delete message ────────────────────────────────────────────────────────
    socket.on('message:delete', async ({ chatId, messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        if (message.sender.toString() !== userId) return;

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = '';
        await message.save();

        io.to(`chat:${chatId}`).emit('message:deleted', { messageId, chatId });
      } catch (err) {
        console.error('[Socket] message:delete error:', err.message);
      }
    });

    // ── React to message ──────────────────────────────────────────────────────
    socket.on('message:react', async ({ chatId, messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existing = message.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          const idx = existing.users.findIndex((u) => u.toString() === userId);
          if (idx >= 0) {
            existing.users.splice(idx, 1);
            if (existing.users.length === 0) {
              message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
            }
          } else {
            existing.users.push(userId);
          }
        } else {
          message.reactions.push({ emoji, users: [userId] });
        }

        await message.save();
        const updated = await Message.findById(messageId).populate('sender', 'name avatar email');
        io.to(`chat:${chatId}`).emit('message:reacted', updated);
      } catch (err) {
        console.error('[Socket] message:react error:', err.message);
      }
    });

    // ── Mark read ─────────────────────────────────────────────────────────────
    socket.on('chat:markRead', async ({ chatId }) => {
      try {
        await Message.updateMany(
          { chatId, readBy: { $nin: [userId] } },
          { $addToSet: { readBy: userId } }
        );
        socket.emit('chat:readAck', { chatId });
      } catch (err) {
        console.error('[Socket] chat:markRead error:', err.message);
      }
    });

    // ── New chat created (notify workspace) ───────────────────────────────────
    socket.on('chat:created', ({ workspaceId, chat }) => {
      socket.to(`workspace:${workspaceId}`).emit('chat:new', chat);
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:online', { userId, online: false });
      console.log(`[Socket] ${socket.user.name} disconnected`);
    });
  });

  return io;
};

export const getOnlineUsers = () => [...onlineUsers.keys()];
