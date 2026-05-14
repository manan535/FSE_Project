import { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import useChatStore from '../../store/chatStore';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ chatId, isGroupChat }) => {
  const { messages, messagesLoading, hasMoreMessages, nextCursor, fetchMessages, typingUsers } = useChatStore();
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const prevMessagesLength = useRef(0);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const list = listRef.current;
      if (list) {
        const isNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 150;
        if (isNearBottom || isInitialLoad.current) {
          bottomRef.current?.scrollIntoView({ behavior: isInitialLoad.current ? 'instant' : 'smooth' });
          isInitialLoad.current = false;
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list || messagesLoading || !hasMoreMessages) return;
    if (list.scrollTop < 100) {
      const prevScrollHeight = list.scrollHeight;
      fetchMessages(chatId, nextCursor).then(() => {
        requestAnimationFrame(() => {
          if (list) list.scrollTop = list.scrollHeight - prevScrollHeight;
        });
      });
    }
  }, [chatId, messagesLoading, hasMoreMessages, nextCursor, fetchMessages]);

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const shouldShowDateSeparator = (index) => {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    const curr = new Date(messages[index].createdAt).toDateString();
    return prev !== curr;
  };

  const chatTyping = typingUsers[chatId] || {};

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto chat-scroll" onScroll={handleScroll}>
      {messagesLoading && hasMoreMessages && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-primary-600" />
        </div>
      )}
      {!messagesLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Start the conversation</h3>
          <p className="text-sm text-gray-400">Send a message to begin chatting</p>
        </div>
      )}
      <div className="py-4">
        {messages.map((message, index) => (
          <div key={message._id}>
            {shouldShowDateSeparator(index) && (
              <div className="flex items-center justify-center my-4 px-4">
                <div className="flex-1 border-t border-gray-200" />
                <span className="px-3 text-[11px] font-medium text-gray-400 bg-transparent">
                  {getDateLabel(message.createdAt)}
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
            )}
            <MessageBubble message={message} isGroupChat={isGroupChat} />
          </div>
        ))}
      </div>
      <AnimatePresence>
        {Object.keys(chatTyping).length > 0 && <TypingIndicator users={chatTyping} />}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
