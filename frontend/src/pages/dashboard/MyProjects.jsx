import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTasks, FaChevronRight, FaUsers, FaProjectDiagram } from 'react-icons/fa';
import useProjectStore from '../../store/projectStore';
import { useWorkspace } from '../../context/WorkspaceContext';
import UserAvatar from '../../components/common/UserAvatar';

const MyProjects = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { loading } = useProjectStore();
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!currentWorkspace) return;
      setFetching(true);
      try {
        const { default: axios } = await import('axios');
        const { data } = await axios.get('/api/projects/my');
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch my projects:', error);
      } finally {
        setFetching(false);
      }
    };
    fetchMyProjects();
  }, [currentWorkspace]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityConfig = {
    low: { label: 'Low', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    medium: { label: 'Medium', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    high: { label: 'High', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
  };

  if (fetching && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-700 border-t-primary-500"></div>
          <p className="text-sm text-gray-500">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Projects</h1>
          <p className="text-gray-400 text-sm mt-1">
            Projects you're a member of · {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <FaProjectDiagram className="text-violet-400 text-xs" />
            <span className="text-xs font-semibold text-violet-300">{projects.length} Projects</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Search your projects..."
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
                        {project.owner?.name === 'You' ? 'Created by you' : `by ${project.owner?.name || 'Unknown'}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed min-h-[2rem]">
                  {project.description || 'No description added'}
                </p>

                {/* Members row */}
                {project.members && project.members.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map((member) => (
                        <UserAvatar key={member._id} user={member} size="xs" />
                      ))}
                      {project.members.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-gray-300">+{project.members.length - 4}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

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
      {filteredProjects.length === 0 && !fetching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📭</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-1">No projects yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchTerm
              ? 'No projects match your search'
              : "You haven't been added to any projects yet. Ask your admin to invite you!"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MyProjects;
