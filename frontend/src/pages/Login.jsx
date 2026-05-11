import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaRocket, FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/workspace-setup');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0a0e1a] to-[#1e1b4b]" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600 rounded-full opacity-15 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600 rounded-full opacity-8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 backdrop-blur-xl bg-gray-900/40 border border-gray-800/60 rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-primary-600/20 p-4 rounded-2xl border border-primary-500/30">
            <FaRocket className="text-primary-400 text-3xl" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h1>
        <p className="text-center text-gray-400 mb-8">Login to access your workspace</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-6 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500" />
              <span className="ml-2 text-sm text-gray-400">Remember me</span>
            </label>
            <a href="#" className="text-sm text-primary-400 hover:text-primary-300">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_30px_rgba(124,58,237,0.3)]"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800/60">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 flex items-center justify-center transition-colors">
            <span>← Back to home</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;