import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { validateEmail, validatePassword } from '../../utils/validators';
import { motion } from 'framer-motion';
import { Building, Mail, Lock } from 'lucide-react';

const AuthPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState('tenant'); // Default role
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Theme configuration for role accent colors
  const getThemeColors = () => {
    switch (role) {
      case 'admin':
        return {
          accent: 'border-rose-500 text-rose-500 ring-rose-500 focus:border-rose-500 focus:ring-rose-500',
          btnBg: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          shadow: 'shadow-rose-100'
        };
      case 'manager':
        return {
          accent: 'border-amber-500 text-amber-500 ring-amber-500 focus:border-amber-500 focus:ring-amber-500',
          btnBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          shadow: 'shadow-amber-100'
        };
      case 'owner':
        return {
          accent: 'border-blue-500 text-blue-500 ring-blue-500 focus:border-blue-500 focus:ring-blue-500',
          btnBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          shadow: 'shadow-blue-100'
        };
      case 'tenant':
      default:
        return {
          accent: 'border-teal-500 text-teal-500 ring-teal-500 focus:border-teal-500 focus:ring-teal-500',
          btnBg: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500',
          badge: 'bg-teal-50 text-teal-700 border-teal-200',
          shadow: 'shadow-teal-100'
        };
    }
  };

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const validRoles = ['admin', 'manager', 'owner', 'tenant'];
    if (roleParam && validRoles.includes(roleParam)) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const theme = getThemeColors();

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      showToast('Please provide a valid email address (e.g. user@example.com)', 'error');
      return;
    }

    const passCheck = validatePassword(password, role);
    if (!passCheck.isValid) {
      showToast(passCheck.message, 'error');
      return;
    }

    setLoading(true);
    const result = await login(email, password, role);
    setLoading(false);

    if (result.success) {
      showToast(`Welcome back, ${result.user.name}!`, 'success');
      navigate(`/${result.user.role}`);
    } else {
      showToast(result.error || 'Invalid credentials.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] -top-52 -left-40 animate-pulse duration-10000" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[100px] -bottom-40 -right-20 animate-pulse duration-7000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-md rounded-3xl border border-white/10 glass-panel shadow-2xl overflow-hidden p-8 flex flex-col items-center z-10 bg-white/5 backdrop-blur-md ${theme.shadow}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Login to VastuSetu</h2>
            <p className="text-sm text-gray-400">Enter your credentials to access your portal.</p>
          </div>
        </div>

        <div className="w-full mb-6">
          <label className="block text-xs font-semibold text-gray-300 mb-2">Role</label>
          <div className="grid grid-cols-4 gap-2">
            {['admin', 'manager', 'owner', 'tenant'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 rounded-2xl text-[11px] font-semibold uppercase tracking-[0.2em] transition-all border ${
                  role === r
                    ? `${theme.badge} border-white/20 shadow-sm`
                    : 'text-gray-400 hover:text-white border-white/10 bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-gray-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="user@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <label className="block text-[11px] font-semibold text-gray-300">Password</label>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
                Must start with {role.substring(0, 3).toUpperCase()}
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder={`${role.substring(0, 3).toUpperCase()}123456`}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-2xl text-xs font-bold text-white shadow-lg transition-all ${theme.btnBg} disabled:opacity-50`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 text-sm text-gray-300 hover:text-white transition-colors"
        >
          Back to homepage
        </button>
      </motion.div>
    </div>
  );
};

export default AuthPage;
