import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Membership from '../models/Membership.js';
import Project from '../models/Project.js';

// @desc    Create or fetch a direct (1:1) chat
// @route   POST /api/chats/direct
export const createDirectChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const workspaceId = req.workspace;

    if (!userId) {
      return res.status(400).json({ message: 'Please provide a user ID' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    // Verify target user is in the same workspace
    const targetMembership = await Membership.findOne({
      user: userId,
      workspace: workspaceId,
      status: 'active'
    });

    if (!targetMembership) {
      return res.status(403).json({ message: 'User is not a member of this workspace' });
    }

    // Check if DM already exists between these two users in this workspace
    const existingChat = await Chat.findOne({
      isGroupChat: false,
      workspace: workspaceId,
      participants: { $all: [req.user._id, userId], $size: 2 }
    })
      .populate('participants', 'name email avatar')
      .populate('latestMessage');

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new DM
    const chat = await Chat.create({
      isGroupChat: false,
      workspace: workspaceId,
      participants: [req.user._id, userId],
      createdBy: req.user._id
    });

    const fullChat = await Chat.findById(chat._id)
      .populate('participants', 'name email avatar')
      .populate('latestMessage');

    // Emit socket event for real-time sidebar update
    const io = req.app.get('io');
    if (io) {
      fullChat.participants.forEach(p => {
        io.to(`user:${p._id}`).emit('chat_created', fullChat);
      });
    }

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a group chat
// @route   POST /api/chats/group
export const createGroupChat = async (req, res) => {
  try {
    const { name, userIds } = req.body;
    const workspaceId = req.workspace;

    if (!name || !userIds || userIds.length < 1) {
      return res.status(400).json({ message: 'Please provide a name and at least 1 other member' });
    }

    // Verify all users are workspace members
    const memberships = await Membership.find({
      user: { $in: userIds },
      workspace: workspaceId,
      status: 'active'
    });

    if (memberships.length !== userIds.length) {
      return res.status(403).json({ message: 'Some users are not members of this workspace' });
    }

    // Include creator in participants
    const participants = [...new Set([req.user._id.toString(), ...userIds])];

    const chat = await Chat.create({
      name,
      isGroupChat: true,
      workspace: workspaceId,
      participants,
      createdBy: req.user._id
    });

    const fullChat = await Chat.findById(chat._id)
      .populate('participants', 'name email avatar')
      .populate('createdBy', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      participants.forEach(pId => {
        io.to(`user:${pId}`).emit('chat_created', fullChat);
      });
    }

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create group chat from a project (auto-include all project members)
// @route   POST /api/chats/group/project
export const createGroupChatFromProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const workspaceId = req.workspace;

    if (!projectId) {
      return res.status(400).json({ message: 'Please provide a project ID' });
    }

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId
    }).populate('members', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if a chat already exists for this project
    const existingChat = await Chat.findOne({
      workspace: workspaceId,
      projectId: projectId,
      isGroupChat: true
    })
      .populate('participants', 'name email avatar')
      .populate('latestMessage');

    if (existingChat) {
      return res.json(existingChat);
    }

    // Gather all project members + the project owner
    const participantIds = [...new Set([
      project.owner.toString(),
      ...project.members.map(m => m._id.toString()),
      req.user._id.toString()
    ])];

    const chat = await Chat.create({
      name: project.name,
      isGroupChat: true,
      workspace: workspaceId,
      participants: participantIds,
      projectId: project._id,
      createdBy: req.user._id
    });

    const fullChat = await Chat.findById(chat._id)
      .populate('participants', 'name email avatar')
      .populate('createdBy', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      participantIds.forEach(pId => {
        io.to(`user:${pId}`).emit('chat_created', fullChat);
      });
    }

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all chats for the current user in the workspace
// @route   GET /api/chats
export const getWorkspaceChats = async (req, res) => {
  try {
    const workspaceId = req.workspace;

    const chats = await Chat.find({
      workspace: workspaceId,
      participants: req.user._id
    })
      .populate('participants', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate({
        path: 'latestMessage',
        populate: { path: 'sender', select: 'name email avatar' }
      })
      .sort({ updatedAt: -1 });

    // Compute unread counts for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          readBy: { $ne: req.user._id },
          sender: { $ne: req.user._id }
        });

        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    res.json(chatsWithUnread);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Pin/unpin a chat
// @route   PUT /api/chats/:id/pin
export const pinChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      workspace: req.workspace,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isPinned = chat.pinnedBy.includes(req.user._id);

    if (isPinned) {
      chat.pinnedBy = chat.pinnedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      chat.pinnedBy.push(req.user._id);
    }

    await chat.save();
    res.json({ pinned: !isPinned });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a group chat (name, add/remove members)
// @route   PUT /api/chats/:id
export const updateGroupChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      workspace: req.workspace,
      isGroupChat: true,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    if (req.body.name) {
      chat.name = req.body.name;
    }

    if (req.body.addMembers) {
      const newMembers = req.body.addMembers.filter(
        id => !chat.participants.includes(id)
      );
      chat.participants.push(...newMembers);
    }

    if (req.body.removeMembers) {
      chat.participants = chat.participants.filter(
        id => !req.body.removeMembers.includes(id.toString())
      );
    }

    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name email avatar')
      .populate('latestMessage');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chat._id}`).emit('chat_updated', updatedChat);
    }

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
