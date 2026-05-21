import { useState, useRef, useCallback } from 'react';
import { FaPaperPlane, FaSmile, FaPaperclip, FaTimes } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import { useSocket } from '../../context/SocketContext';
import useChatStore from '../../store/chatStore';

const MessageInput = ({ chatId }) => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { emitTyping, emitStopTyping } = useSocket();
  const { sendMessage, uploadFiles } = useChatStore();

  const handleTyping = useCallback(() => {
    emitTyping(chatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { emitStopTyping(chatId); }, 2000);
  }, [chatId, emitTyping, emitStopTyping]);

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || sending) return;
    setSending(true);
    try {
      emitStopTyping(chatId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      await sendMessage(chatId, content.trim(), attachments);
      setContent('');
      setAttachments([]);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleEmojiClick = (emojiData) => {
    setContent(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      setAttachments(prev => [...prev, ...uploaded]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => { setAttachments(prev => prev.filter((_, i) => i !== index)); };

  return (
    <div className="bg-white border-t border-gray-200 p-3">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              📎 <span className="truncate max-w-[120px]">{att.filename}</span>
              <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                <FaTimes className="text-[10px]" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0" title="Attach file">
          <FaPaperclip className="text-sm" />
        </button>
        <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />

        <div className="flex-1 relative">
          <textarea ref={inputRef} value={content}
            onChange={e => { setContent(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown} placeholder="Type a message..." rows={1}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all max-h-32"
            style={{ height: 'auto', minHeight: '42px', overflow: content.split('\n').length > 3 ? 'auto' : 'hidden' }}
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; }}
          />
        </div>

        <div className="relative flex-shrink-0">
          <button onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2.5 rounded-xl transition-colors ${showEmoji ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`} title="Add emoji">
            <FaSmile className="text-sm" />
          </button>
          {showEmoji && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowEmoji(false)} />
              <div className="absolute bottom-12 right-0 z-20">
                <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={400}
                  searchPlaceHolder="Search emoji..." previewConfig={{ showPreview: false }} skinTonesDisabled lazyLoadEmojis />
              </div>
            </>
          )}
        </div>

        <button onClick={handleSend} disabled={(!content.trim() && attachments.length === 0) || sending}
          className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${
            content.trim() || attachments.length > 0
              ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-700 hover:to-indigo-700 shadow-sm hover:shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}>
          <FaPaperPlane className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
