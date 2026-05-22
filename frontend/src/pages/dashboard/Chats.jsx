import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCommentDots, FaSearch, FaPlus, FaUsers, FaHashtag,
  FaUserPlus, FaTimes, FaCircle
} from 'react-icons/fa';
import ChatWindow from '../../components/chat/ChatWindow';
import useChatStore from '../../store/chatStore';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSocket } from '../../context/ChatSocketContext';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const truncate = (str, n = 40) =>
  !str ? '' : str.length > n ? str.slice(0, n) + '…' : str;

/* ─── New Group Chat Modal ─────────────────────────────────────────────────── */
const NewGroupModal = ({ onClose, onCreated }) => {
  const { workspaceMembers, createGroupChat } = useChatStore();
  const { notifyNewChat } = useSocket();
  const { currentWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = workspaceMembers.filter((m) =>
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      const chat = await createGroupChat(name.trim(), selected);
      notifyNewChat(currentWorkspace._id, chat);
      onCreated(chat);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111827] border border-gray-700/60 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FaUsers className="text-violet-400" />
            <h3 className="text-sm font-bold text-white">New Group Chat</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400">
            <FaTimes className="text-xs" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Group name */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Group Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team, Sprint Planning…"
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>

          {/* Member search */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">
              Add Members ({selected.length} selected)
            </label>
            <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2 mb-2">
              <FaSearch className="text-gray-500 text-xs" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members…"
                className="bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none flex-1"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.map((m) => (
                <button
                  key={m._id}
                  onClick={() => toggle(m._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${
                    selected.includes(m._id)
                      ? 'bg-violet-500/20 border border-violet-500/30'
                      : 'hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-xl object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{m.name}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  </div>
                  {selected.includes(m._id) && (
                    <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[9px]">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || selected.length === 0 || loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-700 hover:to-indigo-700 transition-all shadow-[0_4px_15px_rgba(124,58,237,0.3)]"
          >
            {loading ? 'Creating…' : 'Create Group Chat'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Chats Page ────────────────────────────────────────────────────────── */
const Chats = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const {
    chats, activeChat, unreadCounts, onlineUserIds, loading,
    fetchChats, fetchWorkspaceMembers, accessDirectChat, setActiveChat,
    workspaceMembers,
  } = useChatStore();

  const [search, setSearch] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [dmLoading, setDmLoading] = useState(false);
  const { notifyNewChat } = useSocket();

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchChats();
      fetchWorkspaceMembers();
    }
  }, [currentWorkspace?._id]);

  const filtered = chats.filter((c) => {
    const name = getChatName(c);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  function getChatName(chat) {
    if (chat.isGroupChat) return chat.name || 'Group Chat';
    const other = chat.participants?.find((p) => p._id !== user?._id);
    return other?.name || 'Direct Message';
  }

  function getOtherUser(chat) {
    return chat.participants?.find((p) => p._id !== user?._id);
  }

  const dms = filtered.filter((c) => !c.isGroupChat);
  const groups = filtered.filter((c) => c.isGroupChat);

  const handleStartDM = async (member) => {
    setDmLoading(true);
    try {
      const chat = await accessDirectChat(member._id);
      notifyNewChat(currentWorkspace._id, chat);
      setShowNewDM(false);
    } catch (e) { console.error(e); }
    finally { setDmLoading(false); }
  };

  const filteredMembers = workspaceMembers.filter((m) =>
    m.name?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  /* ── Chat list item ── */
  const ChatItem = ({ chat }) => {
    const name = getChatName(chat);
    const other = getOtherUser(chat);
    const online = other && onlineUserIds.has(other._id);
    const unread = unreadCounts[chat._id] || 0;
    const isActive = activeChat?._id === chat._id;
    const lastMsg = chat.latestMessage;
    const preview = lastMsg?.isDeleted ? 'Message deleted'
      : lastMsg?.content ? truncate(lastMsg.content) : 'No messages yet';

    return (
      <motion.button
        whileHover={{ x: 3 }}
        onClick={() => setActiveChat(chat)}
        className={`w-full text-left flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all border ${
          isActive
            ? 'bg-violet-600/15 border-violet-500/30 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]'
            : 'hover:bg-gray-800/60 border-transparent'
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {chat.isGroupChat ? (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FaHashtag className="text-white text-sm" />
            </div>
          ) : other?.avatar ? (
            <img src={other.avatar} alt={name} className="w-11 h-11 rounded-2xl object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-base font-bold shadow-md">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {!chat.isGroupChat && (
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0e1a] ${online ? 'bg-emerald-400' : 'bg-gray-600'}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
              {name}
            </span>
            {lastMsg && (
              <span className="text-[10px] text-gray-600 flex-shrink-0 ml-2">{formatTime(chat.updatedAt)}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 truncate">{preview}</span>
            {unread > 0 && (
              <span className="ml-2 flex-shrink-0 min-w-[20px] h-5 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="flex h-[calc(100vh-72px)] gap-0 -m-6 overflow-hidden">
      {/* ── LEFT PANEL ───────────────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 bg-[#0d1424] border-r border-gray-800/60 flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-800/60">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <FaCommentDots className="text-violet-400" />
              Messages
            </h1>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowNewDM(true)}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-violet-300 transition-colors"
                title="New DM"
              >
                <FaUserPlus className="text-xs" />
              </button>
              <button
                onClick={() => setShowNewGroup(true)}
                className="p-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 hover:text-violet-200 transition-colors border border-violet-500/20"
                title="New Group"
              >
                <FaPlus className="text-xs" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/40 rounded-xl px-3 py-2.5">
            <FaSearch className="text-gray-500 text-xs flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none flex-1"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && chats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <FaCommentDots className="text-violet-400 text-xl" />
              </div>
              <p className="text-sm text-gray-500">No conversations yet</p>
              <button
                onClick={() => setShowNewDM(true)}
                className="text-xs text-violet-400 hover:text-violet-300 underline"
              >
                Start a conversation
              </button>
            </div>
          )}

          {dms.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-600 px-4 py-2 font-semibold">
                Direct Messages
              </p>
              {dms.map((c) => <ChatItem key={c._id} chat={c} />)}
            </div>
          )}

          {groups.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600 px-4 py-2 font-semibold">
                Groups & Channels
              </p>
              {groups.map((c) => <ChatItem key={c._id} chat={c} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Chat Window ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div
              key={activeChat._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ChatWindow
                chat={activeChat}
                onClose={() => setActiveChat(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-5 bg-[#0a0e1a] h-full"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.1)]">
                <FaCommentDots className="text-violet-400 text-3xl" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-white mb-1">Your Messages</h2>
                <p className="text-sm text-gray-500">Select a conversation or start a new one</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewDM(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:border-violet-500/50 hover:text-violet-300 transition-all"
                >
                  <FaUserPlus className="text-xs" /> New Message
                </button>
                <button
                  onClick={() => setShowNewGroup(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-[0_4px_15px_rgba(124,58,237,0.3)]"
                >
                  <FaUsers className="text-xs" /> New Group
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── New DM Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewDM && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowNewDM(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111827] border border-gray-700/60 rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <FaUserPlus className="text-violet-400" />
                  <h3 className="text-sm font-bold text-white">New Direct Message</h3>
                </div>
                <button onClick={() => setShowNewDM(false)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400">
                  <FaTimes className="text-xs" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 mb-3">
                  <FaSearch className="text-gray-500 text-xs" />
                  <input
                    autoFocus
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search workspace members…"
                    className="bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none flex-1"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredMembers.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-6">No members found</p>
                  )}
                  {filteredMembers.map((m) => (
                    <button
                      key={m._id}
                      onClick={() => handleStartDM(m)}
                      disabled={dmLoading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-left"
                    >
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-xl object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                          {m.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-200">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                      {onlineUserIds.has(m._id) && (
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

      {/* ── New Group Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewGroup && (
          <NewGroupModal
            onClose={() => setShowNewGroup(false)}
            onCreated={(chat) => setActiveChat(chat)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chats;
