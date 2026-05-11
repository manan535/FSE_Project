import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaClock, FaProjectDiagram } from 'react-icons/fa';
import useInvitationStore from '../store/invitationStore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { inviteInfo, loading, error, fetchInviteInfo, acceptInvite, rejectInvite } = useInvitationStore();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // 'accepted' | 'rejected'

  useEffect(() => {
    if (token) {
      fetchInviteInfo(token).catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    // If not authenticated after auth loading finishes, redirect to login
    if (!authLoading && !isAuthenticated) {
      navigate(`/login?redirect=/invite/${token}`);
    }
  }, [authLoading, isAuthenticated, token, navigate]);

  const handleAccept = async () => {
    setProcessing(true);
    try {
      const data = await acceptInvite(token);
      setResult('accepted');
      toast.success('Invitation accepted! You are now a project member.');
      setTimeout(() => {
        navigate(`/dashboard/projects/${data.projectId}`);
      }, 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await rejectInvite(token);
      setResult('rejected');
      toast.success('Invitation rejected');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!inviteInfo?.expiresAt) return null;
    const diff = new Date(inviteInfo.expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-gray-700 border-t-violet-500"></div>
          <p className="text-gray-400 text-sm">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-rose-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaTimesCircle className="text-3xl text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invitation Unavailable</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-8 max-w-md w-full text-center"
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${result === 'accepted' ? 'bg-emerald-500/15' : 'bg-gray-700/30'}`}>
            {result === 'accepted' ? (
              <FaCheckCircle className="text-3xl text-emerald-400" />
            ) : (
              <FaTimesCircle className="text-3xl text-gray-400" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {result === 'accepted' ? 'Welcome to the Project!' : 'Invitation Rejected'}
          </h2>
          <p className="text-gray-400 text-sm">
            {result === 'accepted'
              ? 'Redirecting you to the project board...'
              : 'Redirecting you to your dashboard...'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/60 shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header accent */}
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${inviteInfo?.project?.color || '#7c3aed'}, #6366f1)` }}
        />

        <div className="p-8">
          {/* Project icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
              style={{ backgroundColor: inviteInfo?.project?.color || '#7c3aed' }}
            >
              {inviteInfo?.project?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-1">
            Project Invitation
          </h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            You've been invited to collaborate
          </p>

          {/* Invitation details card */}
          <div className="bg-gray-800/40 backdrop-blur rounded-xl border border-gray-700/50 p-5 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <FaProjectDiagram className="text-violet-400 text-sm" />
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Project</p>
                <p className="text-sm font-semibold text-white">{inviteInfo?.project?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-violet-400 text-sm">🏢</span>
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Workspace</p>
                <p className="text-sm font-semibold text-white">{inviteInfo?.workspace?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-violet-400 text-sm">👤</span>
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Invited by</p>
                <p className="text-sm font-semibold text-white">{inviteInfo?.invitedBy?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-violet-400 text-sm">🔑</span>
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Your Role</p>
                <p className="text-sm font-semibold text-white capitalize">{inviteInfo?.role}</p>
              </div>
            </div>
          </div>

          {/* Expiry countdown */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <FaClock className="text-amber-400 text-xs" />
            <span className="text-xs font-medium text-amber-300">{getTimeRemaining()}</span>
          </div>

          {/* Email mismatch warning */}
          {user && inviteInfo?.invitedEmail && user.email.toLowerCase() !== inviteInfo.invitedEmail && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-6">
              <p className="text-xs text-rose-300 text-center">
                ⚠️ This invitation was sent to <strong>{inviteInfo.invitedEmail}</strong>. 
                You are logged in as <strong>{user.email}</strong>.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_30px_rgba(16,185,129,0.2)]"
            >
              {processing ? 'Processing...' : '✓ Accept'}
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800/50 hover:text-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteAccept;
