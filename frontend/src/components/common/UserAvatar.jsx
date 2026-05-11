const UserAvatar = ({ user, size = 'md', showName = false }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColor = (name) => {
    if (!name) return 'bg-gray-400';
    const colors = [
      'bg-violet-500',
      'bg-blue-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-cyan-500',
      'bg-fuchsia-500',
      'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${getColor(user.name)} rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white`}
          title={user.name}
        >
          {getInitials(user.name)}
        </div>
      )}
      {showName && <span className="text-sm font-medium text-gray-700">{user.name}</span>}
    </div>
  );
};

export const AvatarGroup = ({ users = [], max = 3, size = 'sm' }) => {
  const displayed = users.slice(0, max);
  const remaining = users.length - max;

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs'
  };

  return (
    <div className="flex items-center -space-x-2">
      {displayed.map((user) => (
        <UserAvatar key={user._id} user={user} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold ring-2 ring-white`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
