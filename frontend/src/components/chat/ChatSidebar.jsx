import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSearch, FaUsers, FaUser, FaThumbtack, FaComments } from 'react-icons/fa';
import useChatStore from '../../store/chatStore';
import useMemberStore from '../../store/memberStore';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import ChatAvatar from './ChatAvatar';
import SearchMembersModal from './SearchMembersModal';
import CreateGroupModal from './CreateGroupModal';

const ChatSidebar = ({ onSelectChat, activeChatId }) => {
  const [searchModal, setSearchModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { chats, unreadCounts, onlineUsers, fetchChats, chatsLoading } = useChatStore();
  const { fetchMembers } = useMemberStore();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchChats();
      fetchMembers(currentWorkspace._id);
    }
  }, [currentWorkspace]);

  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.name;
    const other = chat.participants?.find(p => p._id !== user?._id);
    return other?.name || 'Unknown';
  };

  const getLastMessage = (chat) => {
    if (!chat.latestMessage) return 'No messages yet';
    const msg = chat.latestMessage;
    const senderName = msg.sender?._id === user?._id ? 'You' : msg.sender?.name?.split(' ')[0];
    const content = msg.isDeleted ? 'Message deleted' : msg.content;
    if (chat.isGroupChat) return `${senderName}: ${content}`;
    return msg.sender?._id === user?._id ? `You: ${content}` : content;
  };

  const getTimeLabel = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isUserOnline = (chat) => {
    if (chat.isGroupChat) return false;
    const other = chat.participants?.find(p => p._id !== user?._id);
    return other && onlineUsers.has(other._id);
  };

  const filteredChats = chats.filter(chat => {
    if (search) {
      const name = getChatName(chat).toLowerCase();
      if (!name.includes(search.toLowerCase())) return false;
    }
    if (filter === 'direct') return !chat.isGroupChat;
    if (filter === 'group') return chat.isGroupChat;
    if (filter === 'pinned') return chat.pinnedBy?.includes(user?._id);
    return true;
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    const aPinned = a.pinnedBy?.includes(user?._id) ? 1 : 0;
    const bPinned = b.pinnedBy?.includes(user?._id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const handleChatCreated = (chat) => { onSelectChat(chat); };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaComments className="text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Chats</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setGroupModal(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700" title="Create Group">
              <FaUsers className="text-sm" />
            </button>
            <button onClick={() => setSearchModal(true)} className="p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary-600 hover:text-primary-700" title="New Chat">
              <FaPlus className="text-sm" />
            </button>
          </div>
        </div>
        <div className="relative mb-3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" />
        </div>
        <div className="flex gap-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'direct', label: 'Direct', icon: FaUser },
            { key: 'group', label: 'Groups', icon: FaUsers },
            { key: 'pinned', label: 'Pinned', icon: FaThumbtack }
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === tab.key ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}>
              {tab.icon && <tab.icon className="text-[10px]" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll">
        {chatsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-primary-600" />
          </div>
        ) : sortedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <FaComments className="text-gray-400 text-xl" />
            </div>
            <p className="text-sm font-medium text-gray-500">No chats yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a new conversation</p>
            <button onClick={() => setSearchModal(true)} className="mt-3 text-xs text-primary-600 font-medium hover:text-primary-700">+ New Message</button>
          </div>
        ) : (
          <div className="py-1">
            {sortedChats.map(chat => {
              const unread = unreadCounts[chat._id] || 0;
              const isActive = activeChatId === chat._id;
              const isPinned = chat.pinnedBy?.includes(user?._id) || chat._isPinned;
              return (
                <motion.button key={chat._id} layout onClick={() => onSelectChat(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-all relative group ${
                    isActive ? 'bg-primary-50 border-r-2 border-primary-600' : 'hover:bg-gray-50'
                  }`}>
                  <ChatAvatar chat={chat} user={user} size="md" isOnline={isUserOnline(chat)} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{getChatName(chat)}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isPinned && <FaThumbtack className="text-[9px] text-gray-400" />}
                        <span className="text-[11px] text-gray-400">{getTimeLabel(chat.latestMessage?.createdAt || chat.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate pr-2 ${unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>{getLastMessage(chat)}</p>
                      {unread > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 unread-badge">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <SearchMembersModal isOpen={searchModal} onClose={() => setSearchModal(false)} onChatCreated={handleChatCreated} />
      <CreateGroupModal isOpen={groupModal} onClose={() => setGroupModal(false)} onGroupCreated={handleChatCreated} />
    </div>
  );
};

export default ChatSidebar;
