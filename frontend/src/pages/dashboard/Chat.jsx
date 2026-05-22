import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaLock, FaRocket, FaComments, FaArrowRight, FaSpinner } from 'react-icons/fa';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import useChatStore from '../../store/chatStore';

const ChatPaywall = () => (
  <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{duration:0.4}}
    className="flex items-center justify-center h-[calc(100vh-130px)]">
    <div className="text-center max-w-md px-8">
      <motion.div initial={{y:20}} animate={{y:0}} transition={{delay:0.1}}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
        <FaLock className="text-4xl text-violet-400"/>
      </motion.div>
      <motion.h2 initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.2}}
        className="text-2xl font-bold text-white mb-3">Chat is a Pro Feature</motion.h2>
      <motion.p initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.3}}
        className="text-gray-400 mb-8 leading-relaxed">
        Workspace messaging is not available on the Free plan. Upgrade to <span className="text-violet-300 font-semibold">Pro</span> or above to unlock real-time team chat, direct messages, and group channels.
      </motion.p>
      <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.4}} className="space-y-3">
        <a href="/dashboard/billing"
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-violet-500/20">
          <FaRocket className="text-xs"/> Upgrade Now <FaArrowRight className="text-xs"/>
        </a>
        <div className="flex items-center justify-center gap-6 pt-2">
          {['Direct Messages','Group Channels','File Sharing'].map((f,i) => (
            <span key={i} className="text-xs text-gray-500 flex items-center gap-1"><FaComments className="text-[8px] text-violet-500/50"/>{f}</span>
          ))}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const { chats } = useChatStore();
  const [chatEnabled, setChatEnabled] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data } = await axios.get('/api/billing/info');
        setChatEnabled(data.chatEnabled);
      } catch { setChatEnabled(false); }
      finally { setChecking(false); }
    };
    checkAccess();
  }, []);

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

  if (checking) return (
    <div className="flex items-center justify-center h-[calc(100vh-130px)]">
      <FaSpinner className="animate-spin text-3xl text-violet-400"/>
    </div>
  );

  if (!chatEnabled) return <ChatPaywall />;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}
      className="flex h-[calc(100vh-130px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
