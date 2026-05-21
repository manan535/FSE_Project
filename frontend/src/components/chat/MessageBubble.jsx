import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSmile, FaEdit, FaTrash, FaReply, FaEllipsisH, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import useChatStore from '../../store/chatStore';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const MessageBubble = ({ message, isGroupChat }) => {
  const { user } = useAuth();
  const { addReaction, editMessage, deleteMessage } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const actionsRef = useRef(null);

  const isSender = message.sender?._id === user?._id;
  const senderName = message.sender?.name || 'Unknown';

  if (message.isDeleted) {
    return (
      <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} px-4 py-0.5`}>
        <div className="max-w-xs px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs italic">
          🗑️ This message was deleted
        </div>
      </div>
    );
  }

  const handleReaction = (emoji) => { addReaction(message._id, emoji); setShowReactions(false); };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await editMessage(message._id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => { await deleteMessage(message._id); setShowActions(false); };

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const renderReadReceipt = () => {
    if (!isSender) return null;
    const readCount = message.readBy?.length || 0;
    if (readCount > 1) return <FaCheckDouble className="text-[10px] text-blue-500" />;
    return <FaCheck className="text-[10px] text-gray-400" />;
  };

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} px-4 py-0.5 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}>
      <div className={`flex gap-2 max-w-[70%] ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isSender && isGroupChat && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 mt-auto">
            {senderName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className={`relative ${isSender ? 'items-end' : 'items-start'}`}>
          {!isSender && isGroupChat && (
            <p className="text-[11px] font-medium text-gray-500 mb-0.5 ml-1">{senderName}</p>
          )}

          <motion.div initial={{ opacity: 0, y: 5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`relative px-3.5 py-2 rounded-2xl ${
              isSender ? 'bg-gradient-to-br from-primary-600 to-indigo-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}>
            {isEditing ? (
              <div className="min-w-[200px]">
                <input type="text" value={editContent} onChange={e => setEditContent(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEdit()}
                  className="w-full bg-white/20 rounded px-2 py-1 text-sm outline-none" autoFocus />
                <div className="flex gap-2 mt-1 justify-end">
                  <button onClick={() => setIsEditing(false)} className="text-[10px] opacity-70 hover:opacity-100">Cancel</button>
                  <button onClick={handleEdit} className="text-[10px] font-medium opacity-70 hover:opacity-100">Save</button>
                </div>
              </div>
            ) : (
              <>
                {message.replyTo && (
                  <div className={`text-[11px] mb-1 px-2 py-1 rounded border-l-2 ${
                    isSender ? 'bg-white/10 border-white/30' : 'bg-gray-200 border-gray-400'
                  }`}>
                    <span className="font-medium">{message.replyTo.sender?.name}</span>
                    <p className="truncate opacity-70">{message.replyTo.content}</p>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                {message.attachments?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((att, i) => (
                      <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${
                          isSender ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                        } transition-colors`}>
                        📎 {att.filename}
                        <span className="opacity-60">({(att.size / 1024).toFixed(1)}KB)</span>
                      </a>
                    ))}
                  </div>
                )}
                <div className={`flex items-center gap-1 mt-0.5 ${isSender ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-[10px] ${isSender ? 'text-white/60' : 'text-gray-400'}`}>
                    {formatTime(message.createdAt)}{message.isEdited && ' · edited'}
                  </span>
                  {renderReadReceipt()}
                </div>
              </>
            )}
          </motion.div>

          {message.reactions?.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
              {message.reactions.map((reaction, i) => (
                <button key={i} onClick={() => handleReaction(reaction.emoji)}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-all ${
                    reaction.users?.some(u => (u._id || u) === user?._id)
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}>
                  {reaction.emoji}
                  {reaction.users?.length > 1 && <span className="text-[10px]">{reaction.users.length}</span>}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showActions && !isEditing && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                ref={actionsRef}
                className={`absolute ${isSender ? 'right-0' : 'left-0'} -top-8 flex items-center gap-0.5 bg-white rounded-lg shadow-md border border-gray-200 px-1 py-0.5 z-10`}>
                <button onClick={() => setShowReactions(!showReactions)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="React">
                  <FaSmile className="text-xs" />
                </button>
                {isSender && (
                  <>
                    <button onClick={() => { setIsEditing(true); setShowActions(false); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="Edit">
                      <FaEdit className="text-xs" />
                    </button>
                    <button onClick={handleDelete} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                      <FaTrash className="text-xs" />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showReactions && (
              <motion.div initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`absolute ${isSender ? 'right-0' : 'left-0'} -top-16 bg-white rounded-xl shadow-lg border border-gray-200 px-2 py-1.5 flex gap-1 z-20`}>
                {QUICK_REACTIONS.map(emoji => (
                  <button key={emoji} onClick={() => handleReaction(emoji)} className="text-lg hover:scale-125 transition-transform p-0.5">
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
