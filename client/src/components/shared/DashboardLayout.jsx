import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  Building,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = ({ links, activeTab, setActiveTab, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  // Determine accent color theme based on role
  const getThemeColors = () => {
    switch (user.role) {
      case 'admin':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-600',
          activeText: 'text-rose-700',
          activeBg: 'bg-rose-50 text-rose-600 border-rose-500',
          hoverBg: 'hover:bg-rose-50/50 hover:text-rose-600',
          border: 'border-rose-500',
          accentColor: '#F43F5E',
          roleBadge: 'bg-rose-100 text-rose-800'
        };
      case 'manager':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-600',
          activeText: 'text-amber-700',
          activeBg: 'bg-amber-50 text-amber-600 border-amber-500',
          hoverBg: 'hover:bg-amber-50/50 hover:text-amber-600',
          border: 'border-amber-500',
          accentColor: '#F59E0B',
          roleBadge: 'bg-amber-100 text-amber-800'
        };
      case 'owner':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          activeText: 'text-blue-700',
          activeBg: 'bg-blue-50 text-blue-600 border-blue-500',
          hoverBg: 'hover:bg-blue-50/50 hover:text-blue-600',
          border: 'border-blue-500',
          accentColor: '#3B82F6',
          roleBadge: 'bg-blue-100 text-blue-800'
        };
      case 'tenant':
      default:
        return {
          bg: 'bg-teal-50',
          text: 'text-teal-600',
          activeText: 'text-teal-700',
          activeBg: 'bg-teal-50 text-teal-600 border-teal-500',
          hoverBg: 'hover:bg-teal-50/50 hover:text-teal-600',
          border: 'border-teal-500',
          accentColor: '#14B8A6',
          roleBadge: 'bg-teal-100 text-teal-800'
        };
    }
  };

  const theme = getThemeColors();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-16 md:pb-0">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 flex-shrink-0 z-20">
        {/* Logo Header */}
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-none">VastuSetu</h1>
            <span className="text-xs font-semibold text-gray-400">Apartment System</span>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl border-l-4 border-transparent transition-all ${
                  isActive ? theme.activeBg : `text-gray-500 hover:text-gray-900 ${theme.hoverBg}`
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? theme.text : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile Card & Logout Footer */}
        <div className="p-4 border-t border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold`} style={{ backgroundColor: theme.accentColor }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${theme.roleBadge}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Building className="w-4 h-4" />
          </div>
          <span className="text-md font-bold text-gray-800">VastuSetu</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold`} style={{ backgroundColor: theme.accentColor }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded-lg text-gray-500 hover:bg-gray-50"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-[60px] left-0 w-full bg-white border-b border-gray-100 shadow-xl z-20 flex flex-col p-4 space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      setActiveTab(link.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border border-transparent transition-all ${
                      isActive ? `${theme.activeBg} border-l-4` : `text-gray-500 hover:text-gray-900 ${theme.hoverBg}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{link.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex items-center justify-between p-2">
              <div>
                <p className="text-xs font-bold text-gray-700">{user.name}</p>
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION BAR (Collapses to bottom bar as required) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-16 flex items-center justify-around z-30 px-2 pb-safe">
        {links.slice(0, 4).map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-gray-400 transition-colors ${
                isActive ? theme.text : 'hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium tracking-tight truncate max-w-[64px]">{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-full">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
