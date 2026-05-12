import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaProjectDiagram,
  FaTasks,
  FaUsers,
  FaCheckCircle,
} from "react-icons/fa";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTenant } from "../../context/TenantContext";
import TaskAlertBanners from "../../components/notifications/TaskAlertBanners";

// ─── Animated counter (same as Analytics) ──────────────────────────────────────
const AnimatedNumber = ({ value, duration = 1200 }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{display}</span>;
};

// ─── Summary stat card ─────────────────────────────────────────────────
const SummaryCard = ({ icon: Icon, label, value, gradient, iconBg, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="relative group overflow-hidden bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-5 hover:border-gray-700 transition-all duration-300"
  >
    {/* Decorative gradient blob */}
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500 ${gradient}`} />

    <div className="flex items-center gap-4">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}>
        <Icon className="text-white text-lg" />
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">
          <AnimatedNumber value={value} />
        </p>
      </div>
    </div>
  </motion.div>
);

// ─── Loading skeleton ──────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="space-y-6">
    {/* Stat card skeletons */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-900/40 rounded-2xl border border-gray-800/60 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-800" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-800 rounded w-2/3" />
              <div className="h-6 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
    {/* Content skeletons */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-900/40 rounded-2xl border border-gray-800/60 p-6">
          <div className="h-5 bg-gray-700 rounded-lg w-1/3 mb-5" />
          {[...Array(3)].map((_, j) => (
            <div key={j} className="flex justify-between items-center py-3.5 border-b border-gray-800/30">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-800 rounded w-3/5" />
                <div className="h-3 bg-gray-800/50 rounded w-2/5" />
              </div>
              <div className="h-6 w-16 bg-gray-800 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
    <div className="animate-pulse bg-gray-900/40 rounded-2xl border border-gray-800/60 p-6">
      <div className="h-5 bg-gray-700 rounded-lg w-1/4 mb-5" />
      <div className="flex gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gray-800" />
            <div className="space-y-1.5">
              <div className="h-3 bg-gray-800 rounded w-20" />
              <div className="h-2.5 bg-gray-800/50 rounded w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    todo: 'bg-gray-800 text-gray-300',
    in_progress: 'bg-indigo-500/20 text-indigo-300',
    done: 'bg-emerald-500/20 text-emerald-300',
    active: 'bg-blue-500/20 text-blue-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
    archived: 'bg-gray-800 text-gray-400',
  };
  const labels = {
    todo: 'Todo',
    in_progress: 'In Progress',
    done: 'Done',
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] || 'bg-gray-800 text-gray-400'}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── Priority badge ────────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const styles = {
    high: 'bg-red-500/20 text-red-300',
    medium: 'bg-amber-500/20 text-amber-300',
    low: 'bg-green-500/20 text-green-300',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[priority] || 'bg-gray-800 text-gray-400'}`}>
      {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : '—'}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════
const Overview = () => {
  const { currentWorkspace } = useWorkspace();
  const { tagline } = useTenant();

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      fetchAllData();
    }
  }, [currentWorkspace]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const taskReq = axios.get("/api/tasks");
      const projectReq = axios.get("/api/projects");

      const memberReq = currentWorkspace
        ? axios.get(`/api/workspaces/${currentWorkspace._id}/members`)
        : Promise.resolve({ data: [] });

      const [taskRes, projectRes, memberRes] = await Promise.all([
        taskReq,
        projectReq,
        memberReq,
      ]);

      setTasks(taskRes?.data || []);
      setProjects(projectRes?.data || []);
      setMembers(memberRes?.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const completedTasks = tasks.filter((t) => t.status === "done").length;

  const stats = [
    {
      icon: FaProjectDiagram,
      label: "Projects",
      value: projects.length,
      gradient: "bg-indigo-500",
      iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    },
    {
      icon: FaTasks,
      label: "Total Tasks",
      value: tasks.length,
      gradient: "bg-violet-500",
      iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
    },
    {
      icon: FaUsers,
      label: "Team Members",
      value: members.length,
      gradient: "bg-emerald-500",
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    {
      icon: FaCheckCircle,
      label: "Completed",
      value: completedTasks,
      gradient: "bg-amber-500",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ───── Task Alert Banners (Overdue + Due Soon) ────────────── */}
      <TaskAlertBanners />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-gray-400 mt-1">
          All your workspace data in one place
        </p>
        {tagline && (
          <p className="text-sm text-violet-400 italic mt-1">"{tagline}"</p>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* ───── Summary Cards ─────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <SummaryCard
                  key={stat.label}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  gradient={stat.gradient}
                  iconBg={stat.iconBg}
                  delay={index * 0.05}
                />
              ))}
            </div>

            {/* ───── Recent Projects + Recent Tasks ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-6 hover:border-gray-700 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-white">Recent Projects</h3>
                  <span className="text-xs font-medium text-gray-500 bg-gray-800/50 px-2.5 py-1 rounded-full">
                    {projects.length} total
                  </span>
                </div>

                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                    <FaProjectDiagram className="text-3xl mb-3 text-gray-600" />
                    <p className="text-sm font-medium">No projects yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800/40">
                    {projects.slice(0, 4).map((project) => (
                      <div
                        key={project._id}
                        className="flex items-center justify-between py-3.5 group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color || '#6366f1' }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-violet-300 transition-colors">
                              {project.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {project.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <PriorityBadge priority={project.priority} />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Tasks */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-6 hover:border-gray-700 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-white">Recent Tasks</h3>
                  <span className="text-xs font-medium text-gray-500 bg-gray-800/50 px-2.5 py-1 rounded-full">
                    {tasks.length} total
                  </span>
                </div>

                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                    <FaTasks className="text-3xl mb-3 text-gray-600" />
                    <p className="text-sm font-medium">No tasks yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800/40">
                    {tasks.slice(0, 5).map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center justify-between py-3.5 group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-violet-300 transition-colors">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {task.assignees && task.assignees.length > 0
                              ? task.assignees.map((a) => a.name).join(", ")
                              : "Unassigned"}
                          </p>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* ───── Team Members ───────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-6 hover:border-gray-700 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white">Team Members</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-800/50 px-2.5 py-1 rounded-full">
                  {members.length} members
                </span>
              </div>

              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <FaUsers className="text-3xl mb-3 text-gray-600" />
                  <p className="text-sm font-medium">No team members yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {members.slice(0, 6).map((m) => (
                    <motion.div
                      key={m._id}
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-800/40 hover:border-gray-700 hover:bg-gray-800/30 transition-all duration-200"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0">
                        {m.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">
                          {m.user?.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{m.role}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Overview;