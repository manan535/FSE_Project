import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash, FaFlag, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useTaskStore from '../../store/taskStore';
import useProjectStore from '../../store/projectStore';
import UserAvatar from '../common/UserAvatar';

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'text-emerald-300', bg: 'bg-emerald-500/15', dot: 'bg-emerald-500' },
  { value: 'medium', label: 'Medium', color: 'text-amber-300', bg: 'bg-amber-500/15', dot: 'bg-amber-500' },
  { value: 'high', label: 'High', color: 'text-rose-300', bg: 'bg-rose-500/15', dot: 'bg-rose-500' }
];

const statusOptions = [
  { value: 'todo', label: 'Todo', icon: '📋' },
  { value: 'in_progress', label: 'In Progress', icon: '🚀' },
  { value: 'done', label: 'Done', icon: '✅' }
];

const TaskModal = ({ projectId }) => {
  const { isTaskModalOpen, editingTask, defaultStatus, closeTaskModal, createTask, updateTask, deleteTask } =
    useTaskStore();
  const { currentProject } = useProjectStore();

  // Use project members instead of all workspace members
  const members = currentProject?.members || [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    assignees: []
  });

  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isTaskModalOpen) {
      if (editingTask) {
        setFormData({
          title: editingTask.title || '',
          description: editingTask.description || '',
          status: editingTask.status || 'todo',
          priority: editingTask.priority || 'medium',
          dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '',
          assignees: editingTask.assignees?.map((a) => (typeof a === 'string' ? a : a._id)) || []
        });
      } else {
        setFormData({
          title: '',
          description: '',
          status: defaultStatus || 'todo',
          priority: 'medium',
          dueDate: '',
          assignees: []
        });
      }
    }
  }, [isTaskModalOpen, editingTask, defaultStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      const taskData = {
        ...formData,
        project: projectId,
        dueDate: formData.dueDate || null
      };

      if (editingTask) {
        await updateTask(editingTask._id, taskData);
      } else {
        await createTask(taskData);
      }
    } catch (error) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message || 'Failed to save task';
      if (code === 'TASK_LIMIT_REACHED') {
        toast.error(msg, { duration: 6000, icon: '🔒' });
        closeTaskModal();
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTask) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      setSubmitting(true);
      try {
        await deleteTask(editingTask._id);
      } catch (error) {
        console.error('Task delete failed:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const toggleAssignee = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter((id) => id !== userId)
        : [...prev.assignees, userId]
    }));
  };

  const getAssigneeNames = () => {
    return formData.assignees
      .map((id) => members.find((m) => m._id === id))
      .filter(Boolean);
  };

  if (!isTaskModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={closeTaskModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900/95 backdrop-blur-xl rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-800/60"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
            <h2 className="text-lg font-bold text-white">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <div className="flex items-center gap-2">
              {editingTask && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Delete task"
                >
                  <FaTrash className="text-sm" />
                </button>
              )}
              <button
                onClick={closeTaskModal}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
            <div className="p-6 space-y-5 overflow-y-auto flex-1 kanban-scroll">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Task Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-sm"
                placeholder="Enter task title..."
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-sm resize-none"
                rows={3}
                placeholder="Add a description..."
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-300 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-sm"
                >
                  {statusOptions.map((s) => {
                    const statusOrder = { todo: 0, in_progress: 1, done: 2 };
                    const currentOrder = editingTask ? statusOrder[editingTask.status] : -1;
                    const isBackward = editingTask && statusOrder[s.value] < currentOrder;

                    return (
                      <option key={s.value} value={s.value} disabled={isBackward}>
                        {s.icon} {s.label}{isBackward ? ' 🔒' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  <FaFlag className="inline mr-1.5 text-xs" /> Priority
                </label>
                <div className="flex gap-2">
                  {priorityOptions.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p.value })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        formData.priority === p.value
                          ? `${p.bg} ${p.color} border-current shadow-sm`
                          : 'bg-gray-800/50 text-gray-500 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                <FaCalendarAlt className="inline mr-1.5 text-xs" /> Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-300 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-sm"
              />
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                <FaUsers className="inline mr-1.5 text-xs" /> Assign Members
              </label>

              {/* Selected assignees */}
              {getAssigneeNames().length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {getAssigneeNames().map((member) => (
                    <span
                      key={member._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-300 text-xs font-medium"
                    >
                      <UserAvatar user={member} size="xs" />
                      {member.name}
                      <button
                        type="button"
                        onClick={() => toggleAssignee(member._id)}
                        className="ml-1 text-primary-400 hover:text-primary-200"
                      >
                        <FaTimes className="text-[9px]" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-left text-sm text-gray-500 hover:border-gray-600 transition-all"
                >
                  {formData.assignees.length === 0
                    ? 'Click to assign members...'
                    : `${formData.assignees.length} member(s) selected`}
                </button>

                {showAssigneeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 mt-1 w-full bg-gray-900/95 backdrop-blur-xl border border-gray-800/60 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
                  >
                    {members.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-400">
                        No members found
                      </div>
                    ) : (
                      members.map((member) => (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => toggleAssignee(member._id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-800/50 transition-colors ${
                            formData.assignees.includes(member._id) ? 'bg-primary-500/10' : ''
                          }`}
                        >
                          <UserAvatar user={member} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">
                              {member.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{member.email}</p>
                          </div>
                          {formData.assignees.includes(member._id) && (
                            <span className="text-primary-400 text-sm">✓</span>
                          )}
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            </div>

            {/* Actions — pinned at bottom */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-800/60 bg-gray-900/50 shrink-0">
              <button
                type="submit"
                disabled={submitting || !formData.title.trim()}
                className="flex-1 bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_30px_rgba(124,58,237,0.2)]"
              >
                {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={closeTaskModal}
                className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:bg-gray-800/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskModal;
