import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTasks, FaChevronRight, FaEllipsisV, FaUsers, FaFolder, FaProjectDiagram } from 'react-icons/fa';
import useProjectStore from '../../store/projectStore';
import { useWorkspace } from '../../context/WorkspaceContext';
import UserAvatar from '../../components/common/UserAvatar';
import axios from 'axios';

const colorPresets = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#64748b', '#a855f7'
];

const Projects = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { projects, loading, fetchProjects, createProject, updateProject, deleteProject } = useProjectStore();

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'mine'
  const [myProjects, setMyProjects] = useState([]);
  const [myProjectsLoading, setMyProjectsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium',
    color: '#6366f1'
  });

  useEffect(() => {
    if (currentWorkspace) {
      fetchProjects();
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (viewMode === 'mine' && currentWorkspace) {
      setMyProjectsLoading(true);
      axios.get('/api/projects/my')
        .then(({ data }) => setMyProjects(data))
        .catch(() => setMyProjects([]))
        .finally(() => setMyProjectsLoading(false));
    }
  }, [viewMode, currentWorkspace]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '', priority: 'medium', color: '#6366f1' });
    setShowModal(true);
  };

  const handleOpenEdit = (project, e) => {
    e.stopPropagation();
    setActiveMenu(null);
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      priority: project.priority,
      color: project.color || '#6366f1'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await updateProject(editingProject._id, formData);
      } else {
        await createProject(formData);
      }
      setShowModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setActiveMenu(null);
    if (window.confirm('Delete this project and all its tasks? This action cannot be undone.')) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const displayProjects = viewMode === 'mine' ? myProjects : projects;
  const isListLoading = viewMode === 'mine' ? myProjectsLoading : loading;

  const filteredProjects = displayProjects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityConfig = {
    low: { label: 'Low', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    medium: { label: 'Medium', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    high: { label: 'High', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
  };

  if (isListLoading && displayProjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-700 border-t-primary-500"></div>
          <p className="text-sm text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your team's projects and track progress</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-indigo-700 transition-all shadow-[0_8px_30px_rgba(124,58,237,0.2)]"
        >
          <FaPlus className="text-xs" /> New Project
        </button>
      </div>

      {/* View Toggle + Search Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        {/* Toggle Tabs */}
        <div className="flex bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
          <button
            onClick={() => setViewMode('all')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'all'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FaProjectDiagram className="text-[10px]" /> All Projects
          </button>
          <button
            onClick={() => setViewMode('mine')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'mine'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FaFolder className="text-[10px]" /> My Projects
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-sm transition-all text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project, index) => {
          const counts = project.taskCounts || { todo: 0, in_progress: 0, done: 0, total: 0 };
          const progress = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

          return (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              onClick={() => navigate(`/dashboard/projects/${project._id}`)}
              className="group relative bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 hover:border-gray-700 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Color accent bar */}
              <div
                className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${project.color || '#6366f1'}, ${project.color || '#6366f1'}88)` }}
              />

              <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-200 text-sm truncate group-hover:text-violet-300 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === project._id ? null : project._id);
                      }}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-gray-800/50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <FaEllipsisV className="text-xs" />
                    </button>

                    <AnimatePresence>
                      {activeMenu === project._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-8 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-800/60 shadow-2xl z-20 py-1.5 w-36"
                        >
                          <button
                            onClick={(e) => handleOpenEdit(project, e)}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 transition-colors"
                          >
                            <FaEdit className="text-xs" /> Edit
                          </button>
                          <button
                            onClick={(e) => handleDelete(project._id, e)}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <FaTrash className="text-xs" /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed min-h-[2rem]">
                  {project.description || 'No description added'}
                </p>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-gray-500">Progress</span>
                    <span className="text-[11px] font-bold text-gray-300">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    />
                  </div>
                </div>

                {/* Members row */}
                {project.members && project.members.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map((member, idx) => (
                        <UserAvatar key={member._id || member || idx} user={member} size="xs" />
                      ))}
                      {project.members.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-gray-300">+{project.members.length - 3}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      <FaUsers className="inline text-[9px] mr-0.5" />
                      {project.members.length}
                    </span>
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800/40">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${priorityConfig[project.priority]?.color || ''}`}>
                      {priorityConfig[project.priority]?.label || 'Medium'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <FaTasks className="text-[10px]" /> {counts.total} tasks
                    </span>
                  </div>
                  <FaChevronRight className="text-[10px] text-gray-600 group-hover:text-violet-400 transition-colors" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredProjects.length === 0 && !isListLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📂</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-1">No projects yet</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first project to get started</p>
          <button onClick={handleOpenCreate} className="btn-primary inline-flex items-center gap-2">
            <FaPlus className="text-xs" /> Create Project
          </button>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900/95 backdrop-blur-xl rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-800/60"
            >
              <div className="px-6 py-4 border-b border-gray-800/60">
                <h2 className="text-lg font-bold text-white">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter project name..."
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="What is this project about?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Priority</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                          formData.priority === p
                            ? priorityConfig[p].color + ' shadow-sm'
                            : 'bg-gray-800/50 text-gray-500 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-xl transition-all ${
                          formData.color === color
                            ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-gray-400 scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-indigo-700 transition-all shadow-[0_8px_30px_rgba(124,58,237,0.2)]"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:bg-gray-800/50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;