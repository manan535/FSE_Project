import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import useChatStore from '../../store/chatStore';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const { chats, fetchChats } = useChatStore();

  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c._id === chatId);
      if (chat) setSelectedChat(chat);
    }
  }, [chatId, chats]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    navigate(`/dashboard/chats/${chat._id}`, { replace: true });
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const handleBack = () => {
    setShowSidebar(true);
    setSelectedChat(null);
    navigate('/dashboard/chats', { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-[calc(100vh-130px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className={`${showSidebar ? 'block' : 'hidden'} md:block`}>
        <ChatSidebar onSelectChat={handleSelectChat} activeChatId={selectedChat?._id} />
      </div>
      <div className={`flex-1 ${!showSidebar ? 'block' : 'hidden'} md:block`}>
        <ChatWindow chat={selectedChat} onBack={handleBack} />
      </div>
    </motion.div>
  );
};

export default Chat;
