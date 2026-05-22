import { motion } from 'framer-motion';

const TypingIndicator = ({ users = {} }) => {
  const names = Object.values(users).filter(Boolean);

  if (names.length === 0) return null;

  const text = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-2 px-4 py-1.5"
    >
      <div className="flex items-center gap-1">
        <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-gray-400 italic">{text}</span>
    </motion.div>
  );
};

export default TypingIndicator;
