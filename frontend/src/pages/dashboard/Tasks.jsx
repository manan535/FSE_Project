import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaFilter } from 'react-icons/fa';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import TaskModal from '../../components/kanban/TaskModal';
import useTaskStore from '../../store/taskStore';
import useProjectStore from '../../store/projectStore';
import useMemberStore from '../../store/memberStore';
import { useWorkspace } from '../../context/WorkspaceContext';

const Tasks = () => {
  const { currentWorkspace } = useWorkspace();
  const { tasks, loading, fetchTasks, openTaskModal } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { fetchMembers } = useMemberStore();
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    if (currentWorkspace) {
      fetchProjects();
      fetchMembers(currentWorkspace._id);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      if (selectedProject) {
        fetchTasks(selectedProject);
      } else {
        fetchTasks();
      }
    }
  }, [currentWorkspace, selectedProject]);

  const taskCounts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    total: tasks.length
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-700 border-t-primary-500"></div>
          <p className="text-sm text-gray-500">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Tasks</h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage all tasks across your workspace
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Project filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="pl-8 pr-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800/50 text-sm text-gray-300 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all appearance-none min-w-[180px]"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700 text-[11px] font-semibold text-gray-400">
                📋 {taskCounts.todo}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[11px] font-semibold text-blue-300">
                🚀 {taskCounts.in_progress}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                ✅ {taskCounts.done}
              </span>
            </div>

            <button
              onClick={() => openTaskModal(null, 'todo')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-indigo-700 transition-all shadow-[0_8px_30px_rgba(124,58,237,0.2)]"
            >
              <FaPlus className="text-xs" /> Add Task
            </button>
          </div>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <KanbanBoard />

      {/* Task Modal — uses selectedProject or first project as default */}
      <TaskModal projectId={selectedProject || projects[0]?._id} />
    </div>
  );
};

export default Tasks;