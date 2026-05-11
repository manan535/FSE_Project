import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useWorkspace } from '../../context/WorkspaceContext';
import { FaUserPlus, FaCopy, FaTrash } from 'react-icons/fa';

const Team = () => {
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      fetchMembers();
    }
  }, [currentWorkspace]);

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get(`/api/workspaces/${currentWorkspace._id}/members`);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (currentWorkspace?.inviteCode) {
      navigator.clipboard.writeText(currentWorkspace.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const roleColors = {
    admin: 'bg-purple-500/20 text-purple-300',
    member: 'bg-blue-500/20 text-blue-300',
    viewer: 'bg-gray-800 text-gray-300'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-gray-700 border-t-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Team Members</h1>
          <p className="text-gray-400">Manage your workspace members and roles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card lg:col-span-2"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Workspace Invite</h3>
          
          <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-400 mb-2">Invite Code</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 font-mono text-lg text-white">
                {currentWorkspace?.inviteCode || 'N/A'}
              </code>
              <button
                onClick={copyInviteCode}
                className="btn-primary flex items-center gap-2"
              >
                <FaCopy /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Share this code with people you want to invite to this workspace.
            They can use it during the workspace setup process.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Total Members</p>
              <p className="text-3xl font-bold text-white">{members.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-white">
                {members.filter(m => m.role === 'admin').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Members</p>
              <p className="text-2xl font-bold text-white">
                {members.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-xl font-semibold text-white mb-6">All Members</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Member</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id} className="border-b border-gray-800/30 hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{member.user.name}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {member.role !== 'admin' && (
                      <button className="text-red-400 hover:text-red-300 transition-colors">
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Team;