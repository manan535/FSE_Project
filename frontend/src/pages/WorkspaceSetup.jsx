import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { FaPlus, FaUsers, FaRocket, FaArrowRight, FaBuilding, FaChevronRight } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LogoUpload from '../components/branding/LogoUpload';
import ThemePicker from '../components/branding/ThemePicker';
import BrandingPreview from '../components/branding/BrandingPreview';

const WorkspaceSetup = () => {
  const navigate = useNavigate();
  const { createWorkspace, joinWorkspace, workspaces, switchWorkspace, fetchWorkspaces } = useWorkspace();

  // Always fetch fresh workspaces on mount so the list appears immediately
  useEffect(() => {
    fetchWorkspaces();
  }, []);
  const [mode, setMode] = useState('create');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', tagline: '', companyEmail: '', themeColor: '#7c3aed', logo: ''
  });
  const [inviteCode, setInviteCode] = useState('');
  const [errors, setErrors] = useState({});

  const validateCreate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Workspace name is required';
    if (formData.name.trim().length > 50) e.name = 'Name must be under 50 characters';
    if (formData.tagline.length > 120) e.tagline = 'Tagline must be under 120 characters';
    if (formData.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      e.companyEmail = 'Please enter a valid email';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();
    if (!validateCreate()) return;
    setLoading(true);
    try {
      await createWorkspace(formData);
      toast.success(`"${formData.name}" workspace created!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally { setLoading(false); }
  };

  const handleJoin = async (ev) => {
    ev.preventDefault();
    if (!inviteCode.trim()) { setErrors({ inviteCode: 'Enter an invite code' }); return; }
    setLoading(true);
    try {
      await joinWorkspace(inviteCode);
      toast.success('Joined workspace!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join workspace');
    } finally { setLoading(false); }
  };

  const updateField = (f, v) => {
    setFormData(p => ({ ...p, [f]: v }));
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }));
  };

  const inputCls = (field) => `w-full bg-gray-800/50 border ${errors[field] ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm`;

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0a0e1a] to-[#1e1b4b]" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]" style={{ background: formData.themeColor }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]" style={{ background: formData.themeColor }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start py-8 px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: `${formData.themeColor}20`, border: `1px solid ${formData.themeColor}40` }}>
              <FaRocket className="text-xl" style={{ color: formData.themeColor }} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">Set Up Your Workspace</h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">Create a branded workspace for your team or join an existing one</p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-center bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-1.5 mb-8">
          {[{ key: 'create', icon: FaPlus, label: 'Create New' }, { key: 'join', icon: FaUsers, label: 'Join Existing' }].map(tab => (
            <button key={tab.key} onClick={() => { setMode(tab.key); setErrors({}); }}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${mode === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {mode === tab.key && <motion.div layoutId="activeTab" className="absolute inset-0 rounded-xl" style={{ backgroundColor: formData.themeColor }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <span className="relative z-10 flex items-center gap-2"><tab.icon className="text-xs" />{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Main Card */}
        <AnimatePresence mode="wait">
          {mode === 'create' ? (
            <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="w-full max-w-5xl">
              <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-800/60 rounded-3xl shadow-2xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Form */}
                  <div className="p-6 sm:p-8 lg:border-r border-gray-800/60">
                    <h2 className="text-xl font-bold text-white mb-1">Create Your Workspace</h2>
                    <p className="text-sm text-gray-500 mb-6">Customize your team's identity</p>
                    <form onSubmit={handleCreate} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Workspace Name <span className="text-red-400">*</span></label>
                        <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g., Acme Inc." className={inputCls('name')} />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Tagline</label>
                        <input type="text" value={formData.tagline} onChange={e => updateField('tagline', e.target.value)} placeholder="e.g., Build Faster Together" maxLength={120} className={inputCls('tagline')} />
                        <div className="flex justify-between mt-1">
                          {errors.tagline && <p className="text-red-400 text-xs">{errors.tagline}</p>}
                          <p className="text-xs text-gray-600 ml-auto">{formData.tagline.length}/120</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Company Email</label>
                        <input type="email" value={formData.companyEmail} onChange={e => updateField('companyEmail', e.target.value)} placeholder="team@company.com" className={inputCls('companyEmail')} />
                        {errors.companyEmail && <p className="text-red-400 text-xs mt-1">{errors.companyEmail}</p>}
                      </div>
                      <ThemePicker value={formData.themeColor} onChange={c => updateField('themeColor', c)} />
                      <LogoUpload value={formData.logo} onChange={u => updateField('logo', u)} />
                      <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: formData.themeColor, boxShadow: `0 8px 30px ${formData.themeColor}40` }}>
                        {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>) : (<>Create Workspace <FaArrowRight className="text-xs" /></>)}
                      </motion.button>
                    </form>
                  </div>
                  {/* Preview */}
                  <div className="p-6 sm:p-8 bg-gray-950/30 hidden lg:block">
                    <BrandingPreview name={formData.name} tagline={formData.tagline} themeColor={formData.themeColor} logo={formData.logo} />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="join" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
              <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-800/60 rounded-3xl shadow-2xl p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: `${formData.themeColor}20`, border: `1px solid ${formData.themeColor}30` }}>
                    <FaUsers className="text-xl" style={{ color: formData.themeColor }} />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">Join a Workspace</h2>
                  <p className="text-sm text-gray-500">Enter the invite code shared by your team admin</p>
                </div>
                <form onSubmit={handleJoin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Invite Code</label>
                    <input type="text" value={inviteCode} onChange={e => { setInviteCode(e.target.value); setErrors({}); }} placeholder="Paste your invite code" className={`${inputCls('inviteCode')} font-mono tracking-wider text-center`} />
                    {errors.inviteCode && <p className="text-red-400 text-xs mt-1 text-center">{errors.inviteCode}</p>}
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: formData.themeColor, boxShadow: `0 8px 30px ${formData.themeColor}40` }}>
                    {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Joining...</>) : (<>Join Workspace <FaArrowRight className="text-xs" /></>)}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Your Workspaces */}
        {workspaces.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full max-w-5xl mt-10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FaBuilding className="text-gray-500" />Your Workspaces</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws, i) => (
                <motion.div key={ws._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                  onClick={async () => { await switchWorkspace(ws._id); navigate('/dashboard'); }}
                  className="group backdrop-blur-lg bg-gray-900/40 border border-gray-800/60 rounded-2xl p-5 cursor-pointer hover:border-gray-700 hover:bg-gray-800/40 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    {ws.logo ? (
                      <img src={ws.logo.startsWith('http') ? ws.logo : `http://localhost:5000${ws.logo}`} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: ws.themeColor || '#7c3aed' }}>
                        {(ws.name || 'W').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-white truncate group-hover:text-violet-300 transition-colors">{ws.name}</h4>
                      <p className="text-xs text-gray-500 capitalize">{ws.role}</p>
                    </div>
                    <FaChevronRight className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                  {ws.tagline && <p className="text-xs text-gray-500 italic truncate">"{ws.tagline}"</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Skip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-600 hover:text-gray-400 transition-colors">Skip for now →</button>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkspaceSetup;