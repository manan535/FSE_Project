import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { AvatarGroup } from '../common/UserAvatar';
import useTaskStore from '../../store/taskStore';

const priorityConfig = {
  low: {
    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500',
    label: 'Low'
  },
  medium: {
    color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500',
    label: 'Medium'
  },
  high: {
    color: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500',
    label: 'High'
  }
};

const getOverdueInfo = (dueDate, status) => {
  if (!dueDate || status === 'done') return null;

  const now = new Date();
  const due = new Date(dueDate);
  // Reset time for accurate day calculation
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = now - due;
  if (diffMs <= 0) return null; // Not overdue

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return { days: 1, label: 'Overdue by 1 day' };
  return { days: diffDays, label: `Overdue by ${diffDays} days` };
};

const TaskCard = ({ task }) => {
  const { openTaskModal } = useTaskStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { task }
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: isDragging ? 999 : 'auto'
      }
    : undefined;

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const overdueInfo = getOverdueInfo(task.dueDate, task.status);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => openTaskModal(task)}
      className={`group bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200 ${
        overdueInfo
          ? 'border-rose-500/30 bg-rose-500/5'
          : 'border-gray-800/60'
      } ${
        isDragging
          ? 'shadow-xl ring-2 ring-primary-400 rotate-[2deg]'
          : 'hover:shadow-md hover:border-gray-700'
      }`}
    >
      {/* Overdue banner */}
      {overdueInfo && (
        <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
          <FaExclamationTriangle className="text-rose-500 text-[10px] shrink-0" />
          <span className="text-[11px] font-bold text-rose-400">
            {overdueInfo.label}
          </span>
        </div>
      )}

      {/* Priority indicator */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${priority.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
          {priority.label}
        </span>

        {task.project?.color && (
          <div
            className="w-3 h-3 rounded-full ring-2 ring-gray-900 shadow-sm"
            style={{ backgroundColor: task.project.color }}
            title={task.project?.name}
          />
        )}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-200 mb-1.5 text-sm leading-snug line-clamp-2 group-hover:text-primary-300 transition-colors">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Bottom row: due date + assignees */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/40">
        {task.dueDate ? (
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
              overdueInfo ? 'text-rose-500' : 'text-gray-400'
            }`}
          >
            <FaCalendarAlt className="text-[10px]" />
            {new Date(task.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        ) : (
          <span />
        )}

        {task.assignees && task.assignees.length > 0 && (
          <AvatarGroup users={task.assignees} max={3} size="xs" />
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;
