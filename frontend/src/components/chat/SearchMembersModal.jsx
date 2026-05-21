import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSearch } from 'react-icons/fa';
import useMemberStore from '../../store/memberStore';
import useChatStore from '../../store/chatStore';
import { useAuth } from '../../context/AuthContext';

const SearchMembersModal = ({ isOpen, onClose, onChatCreated }) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { members } = useMemberStore();
  const { createDirectChat } = useChatStore();
  const { user } = useAuth();

  const filteredMembers = members.filter(m =>
    m._id !== user?._id &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
     m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStartChat = async (memberId) => {
    setLoading(true);
    try {
      const chat = await createDirectChat(memberId);
      onChatCreated(chat);
      onClose();
      setSearch('');
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">New Message</h3>
              <p className="text-xs text-gray-400 mt-0.5">Start a conversation with a team member</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Member List */}
          <div className="max-h-80 overflow-y-auto px-4 pb-4 chat-scroll">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">
                  {search ? 'No members found' : 'No other members in workspace'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMembers.map(member => (
                  <button
                    key={member._id}
                    onClick={() => handleStartChat(member._id)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{member.name}</p>
                      <p className="text-xs text-gray-400 truncate">{member.email}</p>
                    </div>
                    <span className="text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Message
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchMembersModal;
