import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Bell, 
  Wrench, 
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  CheckCircle
} from 'lucide-react';
import useToast from '../../hooks/useToast';

const Homepage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) {
      showToast('Please fill out all contact fields.', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Thank you! Your message has been sent successfully.', 'success');
      setContactName('');
      setContactEmail('');
      setContactMsg('');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] -top-40 -left-20 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] top-[40%] right-[-10%] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-white/5 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              VastuSetu
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#about" className="hover:text-indigo-400 transition-colors">About</a>
            <a href="#contact" className="hover:text-indigo-400 transition-colors">Contact</a>
          </nav>

          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <span>Resident Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Integrated Apartment Management</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Elevate Your Apartment Living Experience with <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">VastuSetu</span>
          </h1>

          <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
            The definitive MERN stack platform crafted to unify building admins, managers, owners, and tenants. Seamless payment tracking, realtime notices, and interactive maintenance dashboards in one single portal.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/15 transition-all hover:shadow-indigo-500/25 active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-2xl transition-all flex items-center justify-center text-sm"
            >
              <span>Learn More</span>
            </a>
          </div>
        </motion.div>
      </section>

      <section className="py-12 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <h2 className="text-2xl md:text-4xl font-extrabold">Choose your portal</h2>
          <p className="text-gray-400 text-sm md:text-base">Select the role that matches your access level and continue to the relevant login experience.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Admin', role: 'admin', description: 'Manage users, flats, payments, and building operations.', color: 'from-rose-500 to-rose-600' },
            { label: 'Manager', role: 'manager', description: 'Handle maintenance, complaints, and resident coordination.', color: 'from-amber-500 to-amber-600' },
            { label: 'Owner', role: 'owner', description: 'View property ownership details, rent ledger, and notices.', color: 'from-sky-500 to-blue-600' },
            { label: 'Tenant', role: 'tenant', description: 'Access rent payments, notices, and service tickets.', color: 'from-teal-500 to-cyan-600' }
          ].map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => navigate(`/auth?role=${item.role}`)}
              className={`group rounded-3xl p-8 text-left bg-gradient-to-br ${item.color} text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1`}
            >
              <span className="block text-xs uppercase tracking-[0.3em] opacity-80 mb-3">{item.label}</span>
              <h3 className="text-2xl font-extrabold mb-3">{item.label} Portal</h3>
              <p className="text-sm leading-relaxed text-white/85">{item.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold opacity-90">
                Continue <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold">All-In-One Residential Suite</h2>
          <p className="text-gray-400 text-sm">
            Everything you need to successfully manage your properties and communicate with residents in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 bg-white/5 border border-white/10 rounded-3xl flex flex-col justify-between hover:bg-white/10 transition-all duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Role-Based Portals</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Dedicated interfaces tailored specifically for Admins, Managers, Owners, and Tenants with secure access control and targeted views.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-indigo-400 text-xs font-bold gap-1">
              <span>Security Guaranteed</span>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 bg-white/5 border border-white/10 rounded-3xl flex flex-col justify-between hover:bg-white/10 transition-all duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Mock Billings & Receipts</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Rent collection dashboard for tenants featuring integrated card input validation and instant downloadable print receipts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-purple-400 text-xs font-bold gap-1">
              <span>Receipt Printing Available</span>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 bg-white/5 border border-white/10 rounded-3xl flex flex-col justify-between hover:bg-white/10 transition-all duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Realtime Chat & Noticeboard</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Stay updated via Socket.io powered instant chats, direct notifications, water log telemetry, and building-wide notice boards.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-teal-400 text-xs font-bold gap-1">
              <span>Powered by Socket.io</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-semibold uppercase tracking-wider">
              About VastuSetu
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Bridging the gap between apartment management and residents.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              VastuSetu simplifies residential operations by creating an environment where apartment building records, maintenance tracking, parking registry, and financial ledger data are organized securely.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-gray-300 font-semibold">Strict name, phone, and role prefix validation rules.</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-gray-300 font-semibold">Complete database isolation preventing cross-role access.</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-gray-300 font-semibold">Live socket-based notifications and messaging chat servers.</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="relative p-8 bg-slate-900 border border-white/5 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Maintenance Manager</h4>
                  <p className="text-[10px] text-gray-500">Track and assign complaints dynamically</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Instant Notifications</h4>
                  <p className="text-[10px] text-gray-500">Broadcast maintenance alarms instantly</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Compliance Safeguard</h4>
                  <p className="text-[10px] text-gray-500">Strict validation rules strictly enforced</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5 space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold">Get In Touch</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Have questions about how to set up VastuSetu for your building or need support? Drop us a message, and our team will get back to you.
            </p>
            <div className="space-y-4 pt-4 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-400" />
                <span>support@vastusetu.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-indigo-400" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <span>VastuSetu Building, Sector-5, Bangalore</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <form onSubmit={handleContactSubmit} className="p-8 bg-white/5 border border-white/5 rounded-3xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we help you?"
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl transition-colors shadow-lg shadow-indigo-600/10 disabled:opacity-50"
              >
                {loading ? 'Sending Message...' : 'Submit Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Building className="w-4 h-4" />
            </div>
            <span className="text-md font-bold tracking-tight">VastuSetu</span>
          </div>

          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} VastuSetu. Developed with premium MERN stack architecture. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
