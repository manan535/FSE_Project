import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

// @desc    Send a message
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, attachments, replyTo } = req.body;

    if (!chatId || (!content && (!attachments || attachments.length === 0))) {
      return res.status(400).json({ message: 'Please provide chatId and content or attachments' });
    }

    // Verify user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      workspace: req.workspace,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'You are not a participant of this chat' });
    }

    const messageData = {
      sender: req.user._id,
      content: content || '',
      chat: chatId,
      readBy: [req.user._id]
    };

    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    let message = await Message.create(messageData);

    // Populate the message
    message = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('chat')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
      });

    // Update the latest message on the chat
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id
    });

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      // Send to all users in the chat room
      io.to(`chat:${chatId}`).emit('message_received', message);

      // Notify all participants for sidebar update (unread counts)
      chat.participants.forEach(pId => {
        if (pId.toString() !== req.user._id.toString()) {
          io.to(`user:${pId}`).emit('chat_updated', {
            chatId,
            latestMessage: message,
            updatedAt: new Date()
          });
          io.to(`user:${pId}`).emit('unread_update', {
            chatId,
            increment: true
          });
        }
      });
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get messages for a chat (paginated)
// @route   GET /api/messages/:chatId
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { cursor, limit = 50 } = req.query;

    // Verify access
    const chat = await Chat.findOne({
      _id: chatId,
      workspace: req.workspace,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { chat: chatId };

    // Cursor-based pagination: get messages older than cursor
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1);

    const hasMore = messages.length > parseInt(limit);
    const result = hasMore ? messages.slice(0, parseInt(limit)) : messages;

    res.json({
      messages: result.reverse(),
      hasMore,
      nextCursor: hasMore ? result[0].createdAt.toISOString() : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:chatId
export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify access
    const chat = await Chat.findOne({
      _id: chatId,
      workspace: req.workspace,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark all unread messages in this chat as read by this user
    await Message.updateMany(
      {
        chat: chatId,
        readBy: { $ne: req.user._id },
        sender: { $ne: req.user._id }
      },
      {
        $addToSet: { readBy: req.user._id }
      }
    );

    // Emit read receipt
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatId}`).emit('messages_read', {
        chatId,
        userId: req.user._id
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:id/edit
export const editMessage = async (req, res) => {
  try {
    const { content } = req.body;

    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat}`).emit('message_edited', updatedMessage);
    }

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a message (soft delete)
// @route   DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    message.isDeleted = true;
    message.content = '';
    message.attachments = [];
    await message.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat}`).emit('message_deleted', {
        messageId: message._id,
        chatId: message.chat
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add or toggle a reaction on a message
// @route   POST /api/messages/:id/react
export const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: 'Please provide an emoji' });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify user is in the chat
    const chat = await Chat.findOne({
      _id: message.chat,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find if reaction with this emoji already exists
    const existingReaction = message.reactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      const userIndex = existingReaction.users.indexOf(req.user._id);
      if (userIndex > -1) {
        // Remove user from reaction
        existingReaction.users.splice(userIndex, 1);
        // Remove reaction if no users left
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user to existing reaction
        existingReaction.users.push(req.user._id);
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [req.user._id]
      });
    }

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('reactions.users', 'name');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat}`).emit('message_reacted', {
        messageId: message._id,
        reactions: updatedMessage.reactions
      });
    }

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload attachments
// @route   POST /api/messages/upload
export const uploadAttachments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const attachments = req.files.map(file => ({
      filename: file.originalname,
      url: `/uploads/${file.filename}`,
      type: file.mimetype,
      size: file.size
    }));

    res.json(attachments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
