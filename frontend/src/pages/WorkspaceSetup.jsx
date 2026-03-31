import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { FaPlus, FaUsers, FaBuilding } from 'react-icons/fa';


const WorkspaceSetup = () => {
    const navigate = useNavigate();
    const { createWorkspace, joinWorkspace, workspaces, switchWorkspace } = useWorkspace();
    const [mode, setMode] = useState('create');
    const [workspaceName, setWorkspaceName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        setError('');

        if (!workspaceName.trim()) {
            setError('Please enter a workspace name');
            return;
        }

        setLoading(true);
        try {
            await createWorkspace(workspaceName);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create workspace');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinWorkspace = async (e) => {
        e.preventDefault();
        setError('');

        if (!inviteCode.trim()) {
            setError('Please enter an invite code');
            return;
        }

        setLoading(true);
        try {
            await joinWorkspace(inviteCode);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join workspace');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary-600 p-4 rounded-full">
                            <FaBuilding className="text-white text-3xl" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Workspace</h1>
                    <p className="text-gray-600">Create a new workspace or join an existing one</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => setMode('create')}
                        className={`p-6 rounded-xl border-2 transition-all duration-200 ${mode === 'create'
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <FaPlus className={`text-3xl mx-auto mb-3 ${mode === 'create' ? 'text-primary-600' : 'text-gray-400'}`} />
                        <h3 className="font-semibold text-gray-900">Create New</h3>
                        <p className="text-sm text-gray-600 mt-1">Start a new workspace</p>
                    </button>

                    <button
                        onClick={() => setMode('join')}
                        className={`p-6 rounded-xl border-2 transition-all duration-200 ${mode === 'join'
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <FaUsers className={`text-3xl mx-auto mb-3 ${mode === 'join' ? 'text-primary-600' : 'text-gray-400'}`} />
                        <h3 className="font-semibold text-gray-900">Join Existing</h3>
                        <p className="text-sm text-gray-600 mt-1">Use an invite code</p>
                    </button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {mode === 'create' ? (
                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleCreateWorkspace}
                        className="space-y-6"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Workspace Name
                            </label>
                            <input
                                type="text"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                className="input-field"
                                placeholder="e.g., Acme Inc., My Team, Personal Projects"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Choose a name that represents your team or project
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Workspace...' : 'Create Workspace'}
                        </button>
                    </motion.form>
                ) : (
                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleJoinWorkspace}
                        className="space-y-6"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Invite Code
                            </label>
                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                className="input-field"
                                placeholder="Enter the invite code you received"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Ask your team admin for an invite code to join their workspace
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Joining Workspace...' : 'Join Workspace'}
                        </button>
                    </motion.form>
                )}

                {workspaces.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            Your Workspaces
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {workspaces.map((ws) => (
                                <div
                                    key={ws._id}
                                    onClick={async () => {
                                        await switchWorkspace(ws._id);
                                        navigate('/dashboard');
                                    }}
                                    className="p-5 rounded-xl border shadow-sm bg-gray-50 hover:shadow-md transition cursor-pointer"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {ws.name}
                                    </h3>

                                    <p className="text-sm text-gray-500 mt-1">
                                        ID: {ws._id}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Skip for now →
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default WorkspaceSetup;