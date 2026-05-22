import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaPlus, FaCommentDots, FaUsers, FaCircle,
  FaHashtag, FaTimes, FaUserPlus
} from 'react-icons/fa';
import useChatStore from '../../store/chatStore';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSocket } from '../../context/ChatSocketContext';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const truncate = (str, n = 32) =>
  !str ? '' : str.length > n ? str.slice(0, n) + '…' : str;

const ChatSidebarSection = ({ onOpenChat }) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { notifyNewChat } = useSocket();
  const {
    chats, activeChat, unreadCounts, onlineUserIds,
    workspaceMembers, loading,
    fetchChats, fetchWorkspaceMembers, accessDirectChat, setActiveChat,
  } = useChatStore();

  const [search, setSearch] = useState('');
  const [showNewDM, setShowNewDM] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [dmLoading, setDmLoading] = useState(false);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchChats();
      fetchWorkspaceMembers();
    }
  }, [currentWorkspace?._id]);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const filtered = chats.filter((c) => {
    const name = getChatDisplayName(c, user);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const dms = filtered.filter((c) => !c.isGroupChat);
  const groups = filtered.filter((c) => c.isGroupChat);

  function getChatDisplayName(chat, me) {
    if (chat.isGroupChat) return chat.name || 'Group Chat';
    const other = chat.participants?.find((p) => p._id !== me?._id);
    return other?.name || 'Direct Message';
  }

  function getChatAvatar(chat, me) {
    if (chat.isGroupChat) return null;
    return chat.participants?.find((p) => p._id !== me?._id);
  }

  function isOnline(chat, me) {
    if (chat.isGroupChat) return false;
    const other = chat.participants?.find((p) => p._id !== me?._id);
    return other && onlineUserIds.has(other._id);
  }

  const handleChatClick = (chat) => {
    setActiveChat(chat);
    onOpenChat(chat);
  };

  const handleStartDM = async (member) => {
    setDmLoading(true);
    try {
      const chat = await accessDirectChat(member._id);
      notifyNewChat(currentWorkspace._id, chat);
      setShowNewDM(false);
      onOpenChat(chat);
    } catch (e) {
      console.error(e);
    } finally {
      setDmLoading(false);
    }
  };

  const filteredMembers = workspaceMembers.filter((m) =>
    m.name?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const ChatItem = ({ chat }) => {
    const displayName = getChatDisplayName(chat, user);
    const avatarUser = getChatAvatar(chat, user);
    const online = isOnline(chat, user);
    const unread = unreadCounts[chat._id] || 0;
    const isActive = activeChat?._id === chat._id;
    const lastMsg = chat.latestMessage;
    const lastText = lastMsg?.isDeleted
      ? 'Message deleted'
      : lastMsg?.content
      ? truncate(lastMsg.content)
      : 'No messages yet';

    return (
      <motion.button
        whileHover={{ x: 2 }}
        onClick={() => handleChatClick(chat)}
        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
          isActive
            ? 'bg-violet-600/20 border border-violet-500/30'
            : 'hover:bg-gray-800/60 border border-transparent'
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {chat.isGroupChat ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <FaHashtag className="text-white text-xs" />
            </div>
          ) : avatarUser?.avatar ? (
            <img
              src={avatarUser.avatar}
              alt={displayName}
              className="w-8 h-8 rounded-xl object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0b1120]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold truncate ${isActive ? 'text-violet-200' : 'text-gray-200'}`}>
              {displayName}
            </span>
            {lastMsg && (
              <span className="text-[10px] text-gray-500 flex-shrink-0 ml-1">
                {formatTime(chat.updatedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[11px] text-gray-500 truncate">{lastText}</span>
            {unread > 0 && (
              <span className="ml-1 flex-shrink-0 min-w-[18px] h-[18px] bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaCommentDots className="text-violet-400 text-sm" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
            Chats
          </span>
          {totalUnread > 0 && (
            <span className="bg-violet-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowNewDM(true)}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-violet-300 transition-colors"
          title="New Direct Message"
        >
          <FaPlus className="text-xs" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-2.5 py-1.5">
          <FaSearch className="text-gray-500 text-[10px] flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="bg-transparent text-[11px] text-gray-300 placeholder-gray-600 outline-none flex-1 min-w-0"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-700">
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* DMs */}
        {dms.length > 0 && (
          <div className="mb-1">
            <p className="text-[9px] uppercase tracking-widest text-gray-600 px-3 py-1.5 font-semibold">
              Direct Messages
            </p>
            {dms.map((c) => <ChatItem key={c._id} chat={c} />)}
          </div>
        )}

        {/* Groups */}
        {groups.length > 0 && (
          <div className="mb-1">
            <p className="text-[9px] uppercase tracking-widest text-gray-600 px-3 py-1.5 font-semibold">
              Groups & Channels
            </p>
            {groups.map((c) => <ChatItem key={c._id} chat={c} />)}
          </div>
        )}

        {!loading && chats.length === 0 && (
          <div className="text-center py-6 px-3">
            <FaCommentDots className="text-gray-700 text-2xl mx-auto mb-2" />
            <p className="text-xs text-gray-600">No chats yet</p>
            <button
              onClick={() => setShowNewDM(true)}
              className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 underline"
            >
              Start a conversation
            </button>
          </div>
        )}
      </div>

      {/* New DM Modal */}
      <AnimatePresence>
        {showNewDM && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewDM(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111827] border border-gray-700/60 rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <FaUserPlus className="text-violet-400" />
                  <h3 className="text-sm font-bold text-white">New Message</h3>
                </div>
                <button
                  onClick={() => setShowNewDM(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>

              <div className="p-3">
                <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl px-3 py-2 mb-3">
                  <FaSearch className="text-gray-500 text-xs" />
                  <input
                    autoFocus
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search workspace members..."
                    className="bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none flex-1"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredMembers.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-4">No members found</p>
                  )}
                  {filteredMembers.map((member) => (
                    <button
                      key={member._id}
                      onClick={() => handleStartDM(member)}
                      disabled={dmLoading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-left"
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-xl object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-200">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      {onlineUserIds.has(member._id) && (
                        <FaCircle className="ml-auto text-emerald-400 text-[8px]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatSidebarSection;
