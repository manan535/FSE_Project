import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEnvelope, FaUserPlus, FaRedo, FaUsers, FaCheck, FaClock } from 'react-icons/fa';
import useInvitationStore from '../../store/invitationStore';
import UserAvatar from '../common/UserAvatar';
import toast from 'react-hot-toast';

const InviteMemberModal = ({ isOpen, onClose, projectId, projectMembers = [] }) => {
  const { invitations, loading, sendInvite, fetchInvitations, resendInvite } = useInvitationStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' | 'pending' | 'members'

  useEffect(() => {
    if (isOpen && projectId) {
      fetchInvitations(projectId);
    }
  }, [isOpen, projectId]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    try {
      await sendInvite(projectId, email.trim(), role);
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (inviteId) => {
    try {
      await resendInvite(projectId, inviteId);
      toast.success('Invitation resent');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: <FaClock className="text-[9px]" /> },
      accepted: { label: 'Accepted', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: <FaCheck className="text-[9px]" /> },
      rejected: { label: 'Rejected', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', icon: <FaTimes className="text-[9px]" /> },
      expired: { label: 'Expired', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30', icon: <FaClock className="text-[9px]" /> }
    };
    const c = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${c.color}`}>
        {c.icon} {c.label}
      </span>
    );
  };

  if (!isOpen) return null;

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const otherInvitations = invitations.filter((inv) => inv.status !== 'pending');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900/95 backdrop-blur-xl rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-gray-800/60"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-500/15 rounded-xl flex items-center justify-center">
                <FaUserPlus className="text-violet-400 text-sm" />
              </div>
              <h2 className="text-lg font-bold text-white">Team Management</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Tab navigation */}
          <div className="flex border-b border-gray-800/60">
            {[
              { id: 'invite', label: 'Invite', icon: <FaEnvelope className="text-xs" /> },
              { id: 'pending', label: `Pending (${pendingInvitations.length})`, icon: <FaClock className="text-xs" /> },
              { id: 'members', label: `Members (${projectMembers.length})`, icon: <FaUsers className="text-xs" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-violet-300 border-b-2 border-violet-500 bg-violet-500/5'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Invite Tab */}
            {activeTab === 'invite' && (
              <div className="p-6">
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all text-sm"
                        placeholder="colleague@company.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                      Role
                    </label>
                    <div className="flex gap-2">
                      {['member', 'viewer'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                            role === r
                              ? 'bg-violet-500/15 text-violet-300 border-violet-500/30 shadow-sm'
                              : 'bg-gray-800/50 text-gray-500 border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !email.trim()}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_30px_rgba(124,58,237,0.2)]"
                  >
                    {sending ? 'Sending...' : 'Send Invitation'}
                  </button>
                </form>

                <p className="text-[11px] text-gray-500 mt-4 text-center">
                  The user must be a workspace member. Invitations expire in 48 hours.
                </p>
              </div>
            )}

            {/* Pending Tab */}
            {activeTab === 'pending' && (
              <div className="p-4">
                {invitations.length === 0 ? (
                  <div className="text-center py-8">
                    <FaEnvelope className="text-3xl text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No invitations sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invitations.map((inv) => (
                      <div
                        key={inv._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-800/40 hover:border-gray-700 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-200 truncate">{inv.invitedEmail}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(inv.status)}
                            <span className="text-[10px] text-gray-500 capitalize">{inv.role}</span>
                          </div>
                        </div>
                        {(inv.status === 'pending' || inv.status === 'expired') && (
                          <button
                            onClick={() => handleResend(inv._id)}
                            className="p-2 text-gray-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-all ml-2"
                            title="Resend invitation"
                          >
                            <FaRedo className="text-xs" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="p-4">
                {projectMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <FaUsers className="text-3xl text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No members yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectMembers.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-800/40"
                      >
                        <UserAvatar user={member} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InviteMemberModal;
