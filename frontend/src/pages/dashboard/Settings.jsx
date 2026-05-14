import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { FaSave } from 'react-icons/fa';

const Settings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Update settings:', formData);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>

              <button type="submit" className="btn-primary flex items-center gap-2">
                <FaSave /> Save Changes
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Change Password</h3>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field"
                />
              </div>

              <button type="submit" className="btn-primary">
                Update Password
              </button>
            </form>
          </motion.div>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Preferences</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Email Notifications</span>
                <input type="checkbox" className="rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Desktop Notifications</span>
                <input type="checkbox" className="rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Weekly Summary</span>
                <input type="checkbox" className="rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500" defaultChecked />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card mt-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Danger Zone</h3>

            <button className="w-full bg-red-600/20 border border-red-500/30 text-red-400 py-2 rounded-lg hover:bg-red-600/30 transition-colors">
              Delete Account
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;