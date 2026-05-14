import { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import useChatStore from '../../store/chatStore';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { FaComments } from 'react-icons/fa';

const ChatWindow = ({ chat, onBack }) => {
  const { joinChat, leaveChat } = useSocket();
  const { fetchMessages, markAsRead, setActiveChat } = useChatStore();

  useEffect(() => {
    if (chat?._id) {
      setActiveChat(chat);
      joinChat(chat._id);
      fetchMessages(chat._id);
      markAsRead(chat._id);

      return () => {
        leaveChat(chat._id);
      };
    }
  }, [chat?._id]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4">
            <FaComments className="text-3xl text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-1">Welcome to Chats</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Select a conversation from the sidebar or start a new one to begin messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <ChatHeader chat={chat} onBack={onBack} />
      <MessageList chatId={chat._id} isGroupChat={chat.isGroupChat} />
      <MessageInput chatId={chat._id} />
    </div>
  );
};

export default ChatWindow;
