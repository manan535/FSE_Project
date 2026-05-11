import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTenant } from '../../context/TenantContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { FaSave, FaPalette, FaCopy, FaCheck, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LogoUpload from '../../components/branding/LogoUpload';
import ThemePicker from '../../components/branding/ThemePicker';
import BrandingPreview from '../../components/branding/BrandingPreview';

const TenantSettings = () => {
  const { tenantName, logo, tagline, themeColor, companyEmail, inviteCode, isAdmin, updateTenantSettings, loading: tenantLoading } = useTenant();
  const { currentWorkspace } = useWorkspace();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', tagline: '', companyEmail: '', themeColor: '#7c3aed', logo: '' });

  useEffect(() => {
    setForm({ name: tenantName || currentWorkspace?.name || '', tagline: tagline || '', companyEmail: companyEmail || '', themeColor: themeColor || '#7c3aed', logo: logo || '' });
  }, [tenantName, tagline, themeColor, companyEmail, logo, currentWorkspace]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    try {
      await updateTenantSettings(form);
      toast.success('Branding updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const copyInviteCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const updateField = (f, v) => setForm(p => ({ ...p, [f]: v }));

  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse"><div className="h-8 bg-gray-700 rounded-lg w-1/3 mb-2" /><div className="h-4 bg-gray-800 rounded w-1/2" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="animate-pulse bg-gray-900/40 rounded-2xl border border-gray-800/60 p-6 h-96" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <FaPalette className="text-violet-500" /> Workspace Branding
        </h1>
        <p className="text-gray-400 mt-1">Customize how your workspace looks across the platform</p>
      </motion.div>

      {!isAdmin && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <FaLock className="text-amber-500" />
          <p className="text-sm text-amber-700">Only workspace admins can modify branding settings. You have view-only access.</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 className="text-xl font-semibold text-white mb-6">Branding Settings</h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Workspace Name</label>
              <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} disabled={!isAdmin} className="input-field disabled:opacity-60 disabled:cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Tagline</label>
              <input type="text" value={form.tagline} onChange={e => updateField('tagline', e.target.value)} disabled={!isAdmin} maxLength={120} placeholder="Your workspace motto" className="input-field disabled:opacity-60 disabled:cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">{form.tagline.length}/120</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Company Email</label>
              <input type="email" value={form.companyEmail} onChange={e => updateField('companyEmail', e.target.value)} disabled={!isAdmin} placeholder="team@company.com" className="input-field disabled:opacity-60 disabled:cursor-not-allowed" />
            </div>

            {isAdmin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Theme Color</label>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <ThemePicker value={form.themeColor} onChange={c => updateField('themeColor', c)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <LogoUpload value={form.logo} onChange={u => updateField('logo', u)} />
                  </div>
                </div>
              </>
            )}

            {isAdmin && (
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>

          {/* Invite Code */}
          {inviteCode && (
            <div className="mt-6 pt-6 border-t border-gray-800/60">
              <label className="block text-sm font-medium text-gray-300 mb-2">Invite Code</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono text-white tracking-wider">{inviteCode}</code>
                <button type="button" onClick={copyInviteCode} className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors" title="Copy">
                  {copied ? <FaCheck className="text-green-500" /> : <FaCopy className="text-gray-500" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Share this code to let others join your workspace</p>
            </div>
          )}
        </motion.div>

        {/* Preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card bg-gray-900 border-gray-800">
          <BrandingPreview name={form.name} tagline={form.tagline} themeColor={form.themeColor} logo={form.logo} />
        </motion.div>
      </div>
    </div>
  );
};

export default TenantSettings;
