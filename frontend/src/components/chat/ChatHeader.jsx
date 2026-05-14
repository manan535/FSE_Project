import { FaPhone, FaVideo, FaThumbtack, FaEllipsisV, FaUsers, FaArrowLeft } from 'react-icons/fa';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import useChatStore from '../../store/chatStore';
import ChatAvatar from './ChatAvatar';

const ChatHeader = ({ chat, onBack }) => {
  const { user } = useAuth();
  const { onlineUsers, pinChat, typingUsers } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);

  if (!chat) return null;

  const getChatName = () => {
    if (chat.isGroupChat) return chat.name;
    const other = chat.participants?.find(p => p._id !== user?._id);
    return other?.name || 'Unknown';
  };

  const getSubtitle = () => {
    const chatTyping = typingUsers[chat._id] || {};
    const typingNames = Object.values(chatTyping).filter(Boolean);
    if (typingNames.length > 0) {
      return (
        <span className="text-emerald-500 text-xs flex items-center gap-1">
          <span className="flex gap-0.5">
            <span className="typing-dot w-1 h-1 bg-emerald-500 rounded-full" style={{ animationDelay: '0ms' }} />
            <span className="typing-dot w-1 h-1 bg-emerald-500 rounded-full" style={{ animationDelay: '150ms' }} />
            <span className="typing-dot w-1 h-1 bg-emerald-500 rounded-full" style={{ animationDelay: '300ms' }} />
          </span>
          {typingNames.length === 1 ? `${typingNames[0]} is typing` : 'Several people are typing'}
        </span>
      );
    }
    if (chat.isGroupChat) {
      const count = chat.participants?.length || 0;
      const onlineCount = chat.participants?.filter(p => onlineUsers.has(p._id)).length || 0;
      return `${count} members · ${onlineCount} online`;
    }
    const other = chat.participants?.find(p => p._id !== user?._id);
    return onlineUsers.has(other?._id) ? 'Online' : 'Offline';
  };

  const isOtherOnline = () => {
    if (chat.isGroupChat) return false;
    const other = chat.participants?.find(p => p._id !== user?._id);
    return onlineUsers.has(other?._id);
  };

  const handlePin = () => { pinChat(chat._id); setShowMenu(false); };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 md:hidden">
          <FaArrowLeft className="text-sm" />
        </button>
        <ChatAvatar chat={chat} user={user} size="md" isOnline={isOtherOnline()} />
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{getChatName()}</h3>
          <p className="text-xs text-gray-400">{getSubtitle()}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600" title="Voice call (coming soon)">
          <FaPhone className="text-sm" />
        </button>
        <button className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600" title="Video call (coming soon)">
          <FaVideo className="text-sm" />
        </button>
        {chat.isGroupChat && (
          <button className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600" title="Members">
            <FaUsers className="text-sm" />
          </button>
        )}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
            <FaEllipsisV className="text-sm" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                  <button onClick={handlePin} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <FaThumbtack className="text-xs text-gray-400" />
                    {chat.pinnedBy?.includes(user?._id) ? 'Unpin Chat' : 'Pin Chat'}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
