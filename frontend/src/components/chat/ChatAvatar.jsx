const ChatAvatar = ({ chat, user, size = 'md', isOnline = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg'
  };

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5'
  };

  const getDisplayInfo = () => {
    if (!chat) return { name: '?', color: 'bg-gray-400' };

    if (chat.isGroupChat) {
      return {
        name: chat.name?.charAt(0)?.toUpperCase() || 'G',
        color: chat.projectId
          ? 'bg-gradient-to-br from-violet-500 to-purple-600'
          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
      };
    }

    // For DMs, show the other participant
    const otherUser = chat.participants?.find(
      p => p._id !== user?._id
    );
    if (otherUser?.avatar) {
      return { avatar: otherUser.avatar, name: otherUser.name };
    }
    return {
      name: otherUser?.name?.charAt(0)?.toUpperCase() || '?',
      color: 'bg-gradient-to-br from-primary-500 to-indigo-600'
    };
  };

  const info = getDisplayInfo();

  return (
    <div className="relative flex-shrink-0">
      {info.avatar ? (
        <img
          src={info.avatar}
          alt={info.name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${info.color} rounded-full flex items-center justify-center text-white font-semibold shadow-sm`}
        >
          {info.name}
        </div>
      )}
      {isOnline && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dotSizes[size]} bg-emerald-400 rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
};

export default ChatAvatar;
