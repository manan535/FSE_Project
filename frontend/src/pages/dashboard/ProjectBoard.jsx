import { useState } from 'react';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPlus, FaUserPlus, FaUsers } from 'react-icons/fa';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import TaskModal from '../../components/kanban/TaskModal';
import InviteMemberModal from '../../components/project/InviteMemberModal';
import UserAvatar from '../../components/common/UserAvatar';
import useProjectStore from '../../store/projectStore';
import useTaskStore from '../../store/taskStore';
import useMemberStore from '../../store/memberStore';
import { useWorkspace } from '../../context/WorkspaceContext';

const ProjectBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { currentProject, fetchProject, loading: projectLoading } = useProjectStore();
  const { tasks, fetchTasks, loading: tasksLoading, openTaskModal } = useTaskStore();
  const { fetchMembers } = useMemberStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchTasks(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchMembers(currentWorkspace._id);
    }
  }, [currentWorkspace]);

  const isLoading = projectLoading || tasksLoading;

  if (isLoading && !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-700 border-t-primary-500"></div>
          <p className="text-sm text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  const taskCounts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    total: tasks.length
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/projects')}
              className="p-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-all"
            >
              <FaArrowLeft className="text-sm" />
            </button>
            <div className="flex items-center gap-3">
              {currentProject?.color && (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ backgroundColor: currentProject.color }}
                >
                  {currentProject.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-white">
                  {currentProject?.name || 'Project Board'}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {taskCounts.total} tasks · {taskCounts.done} completed
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Member avatars */}
            {currentProject?.members && currentProject.members.length > 0 && (
              <div className="hidden md:flex items-center gap-2 mr-1">
                <div className="flex -space-x-2">
                  {currentProject.members.slice(0, 5).map((member) => (
                    <UserAvatar key={member._id} user={member} size="xs" />
                  ))}
                  {currentProject.members.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-300">+{currentProject.members.length - 5}</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 font-medium">
                  {currentProject.members.length}
                </span>
              </div>
            )}

            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-2 mr-2">
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

            {/* Invite Member button */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-300 text-sm font-medium hover:border-violet-500/50 hover:text-violet-300 transition-all"
            >
              <FaUserPlus className="text-xs" /> Invite
            </button>

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

      {/* Task Modal */}
      <TaskModal projectId={id} />

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        projectId={id}
        projectMembers={currentProject?.members || []}
      />
    </div>
  );
};

export default ProjectBoard;
