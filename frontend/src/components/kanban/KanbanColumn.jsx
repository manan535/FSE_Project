import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';
import TaskCard from './TaskCard';
import useTaskStore from '../../store/taskStore';

const columnConfig = {
  todo: {
    title: 'Todo',
    color: 'from-slate-500 to-slate-600',
    bg: 'bg-gray-900/30',
    border: 'border-gray-800/60',
    badge: 'bg-gray-800 text-gray-300',
    icon: '📋'
  },
  in_progress: {
    title: 'In Progress',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-300',
    icon: '🚀'
  },
  done: {
    title: 'Done',
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-300',
    icon: '✅'
  }
};

const KanbanColumn = ({ status, tasks }) => {
  const { openTaskModal } = useTaskStore();

  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: { status }
  });

  const config = columnConfig[status] || columnConfig.todo;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-[calc(100vh-280px)] rounded-2xl ${config.bg} border ${config.border} transition-all duration-300 ${
        isOver ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-[#0a0e1a] scale-[1.01] bg-primary-500/10' : ''
      }`}
    >
      {/* Column Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white text-sm shadow-sm`}
            >
              {config.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-200 text-sm">{config.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.badge}`}
            >
              {tasks.length}
            </span>
            <button
              onClick={() => openTaskModal(null, status)}
              className="w-7 h-7 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-primary-400 hover:border-primary-500/40 hover:bg-primary-500/10 transition-all duration-200"
              title={`Add task to ${config.title}`}
            >
              <FaPlus className="text-[10px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto kanban-scroll">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 px-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-800/50 border-2 border-dashed border-gray-700 flex items-center justify-center mb-3">
              <span className="text-2xl opacity-40">{config.icon}</span>
            </div>
            <p className="text-gray-300 text-sm font-medium mb-3">No tasks yet</p>
            <button
              onClick={() => openTaskModal(null, status)}
              className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all"
            >
              <FaPlus className="text-[9px]" /> Add a task
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
