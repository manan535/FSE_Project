import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSearch, FaCheck } from 'react-icons/fa';
import useMemberStore from '../../store/memberStore';
import useChatStore from '../../store/chatStore';
import { useAuth } from '../../context/AuthContext';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { members } = useMemberStore();
  const { createGroupChat } = useChatStore();
  const { user } = useAuth();

  const filteredMembers = members.filter(m =>
    m._id !== user?._id &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
     m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleMember = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    setLoading(true);
    try {
      const chat = await createGroupChat(groupName.trim(), selectedMembers);
      onGroupCreated(chat);
      onClose();
      setGroupName('');
      setSelectedMembers([]);
      setSearch('');
    } catch (error) {
      console.error('Failed to create group:', error);
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
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Create Group Chat</h3>
              <p className="text-xs text-gray-400 mt-0.5">Add members to start a group conversation</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Name</label>
              <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. Design Team, Marketing..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                autoFocus />
            </div>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(id => {
                  const member = members.find(m => m._id === id);
                  return (
                    <motion.span key={id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      {member?.name}
                      <button onClick={() => toggleMember(id)} className="hover:text-primary-900">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </motion.span>
                  );
                })}
              </div>
            )}

            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" />
            </div>

            <div className="max-h-48 overflow-y-auto chat-scroll space-y-1">
              {filteredMembers.map(member => {
                const isSelected = selectedMembers.includes(member._id);
                return (
                  <button key={member._id} onClick={() => toggleMember(member._id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isSelected ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}>
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{member.name}</p>
                      <p className="text-xs text-gray-400 truncate">{member.email}</p>
                    </div>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <FaCheck className="text-white text-[10px]" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <button onClick={handleCreate}
              disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md">
              {loading ? 'Creating...' : `Create Group (${selectedMembers.length} members)`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateGroupModal;
