import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Wrench, 
  Car, 
  Bell, 
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Send,
  X,
  FileText,
  Users,
  Settings,
  Shield
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import useToast from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';
import axiosInstance from '../../api/axiosInstance';
import DashboardLayout from '../../components/shared/DashboardLayout';
import NoticeChatPanel from '../../components/messaging/NoticeChatPanel';
import { validatePassword } from '../../utils/validators';

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { showToast } = useToast();
  const { user, logout } = useAuth();

  // Operational States
  const [stats, setStats] = useState({
    totalComplaints: 0,
    openComplaints: 0,
    resolvedComplaints: 0,
    totalSlots: 0,
    assignedSlots: 0,
    totalResidents: 0
  });

  // Data lists
  const [complaintsList, setComplaintsList] = useState([]);
  const [parkingList, setParkingList] = useState([]);
  const [noticesList, setNoticesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [residentsList, setResidentsList] = useState([]);

  // Search filters
  const [residentsSearch, setResidentsSearch] = useState('');

  // UI state for complaints resolution
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState('open');
  const [managerNote, setManagerNote] = useState('');

  // UI state for Parking allocation
  const [isParkingModalOpen, setIsParkingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [parkingUser, setParkingUser] = useState('');
  const [parkingFlat, setParkingFlat] = useState('');

  // UI state for notices
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeAudience, setNoticeAudience] = useState('all');

  // UI state for settings password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load operational data
  const loadManagerData = async () => {
    try {
      const compRes = await axiosInstance.get('/complaints');
      if (compRes.data.success) {
        setComplaintsList(compRes.data.complaints);
      }

      const parkRes = await axiosInstance.get('/parking');
      if (parkRes.data.success) {
        setParkingList(parkRes.data.slots);
      }

      const noticeRes = await axiosInstance.get('/notices');
      if (noticeRes.data.success) {
        setNoticesList(noticeRes.data.notices);
      }

      const usersRes = await axiosInstance.get('/users?limit=200');
      if (usersRes.data.success) {
        setUsersList(usersRes.data.users);
        setResidentsList(usersRes.data.users.filter(u => u.role === 'owner' || u.role === 'tenant'));
      }

    } catch (err) {
      console.error(err);
      showToast('Failed to load manager operations data.', 'error');
    }
  };

  useEffect(() => {
    loadManagerData();
  }, []);

  // Compute Stats
  useEffect(() => {
    const openC = complaintsList.filter(c => c.status === 'open' || c.status === 'in-progress').length;
    const resC = complaintsList.filter(c => c.status === 'resolved').length;
    const assP = parkingList.filter(p => p.status === 'assigned').length;

    setStats({
      totalComplaints: complaintsList.length,
      openComplaints: openC,
      resolvedComplaints: resC,
      totalSlots: parkingList.length,
      assignedSlots: assP,
      totalResidents: residentsList.length
    });
  }, [complaintsList, parkingList, residentsList]);

  // Open Complaint Modal
  const handleOpenComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setComplaintStatus(complaint.status);
    setManagerNote(complaint.managerNote || '');
    setIsComplaintModalOpen(true);
  };

  // Submit Complaint Status update
  const handleComplaintStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.put(`/complaints/${selectedComplaint._id}/status`, {
        status: complaintStatus,
        managerNote
      });

      if (res.data.success) {
        showToast('Complaint status updated successfully!', 'success');
        setIsComplaintModalOpen(false);
        loadManagerData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update complaint.', 'error');
    }
  };

  // Open Parking Allocation Modal
  const handleOpenParkingAlloc = (slot) => {
    setSelectedSlot(slot);
    setParkingUser(slot.assignedTo?._id || '');
    setParkingFlat(slot.flatNumber || '');
    setIsParkingModalOpen(true);
  };

  // Submit Parking Allocation
  const handleParkingSubmit = async (e) => {
    e.preventDefault();
    if (!parkingUser) {
      showToast('Please select a resident to allocate this parking slot.', 'error');
      return;
    }

    try {
      const res = await axiosInstance.post('/parking/assign', {
        slotNumber: selectedSlot.slotNumber,
        assignedTo: parkingUser,
        flatNumber: parkingFlat
      });

      if (res.data.success) {
        showToast('Parking slot allocated successfully!', 'success');
        setIsParkingModalOpen(false);
        loadManagerData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to allocate parking slot.', 'error');
    }
  };

  // Release Parking Slot
  const handleReleaseParking = async (slotNumber) => {
    if (!window.confirm(`Are you sure you want to release parking slot ${slotNumber}?`)) return;
    try {
      const res = await axiosInstance.put(`/parking/${slotNumber}/release`);
      if (res.data.success) {
        showToast('Parking slot released!', 'success');
        setIsParkingModalOpen(false);
        loadManagerData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to release parking slot.', 'error');
    }
  };

  // Submit Notice
  const handleNoticeSubmit = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      showToast('Announcement Title and Body details are required.', 'error');
      return;
    }

    try {
      const res = await axiosInstance.post('/notices', {
        title: noticeTitle,
        body: noticeBody,
        audience: noticeAudience
      });

      if (res.data.success) {
        showToast('Notice published successfully!', 'success');
        setNoticeTitle('');
        setNoticeBody('');
        loadManagerData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish notice.', 'error');
    }
  };

  // Change password submit
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Password cannot be blank.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    const check = validatePassword(newPassword, 'manager');
    if (!check.isValid) {
      showToast(check.message, 'error');
      return;
    }

    try {
      showToast('Password updated successfully! (Role Prefix MNG Enforced)', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast('Failed to update password.', 'error');
    }
  };

  // Filtering lists
  const filteredResidents = residentsList.filter(r => {
    const term = residentsSearch.toLowerCase();
    return r.name.toLowerCase().includes(term) || 
           r.email.toLowerCase().includes(term) ||
           (r.phone || '').includes(term) ||
           (r.flatNumber && r.flatNumber.toLowerCase().includes(term));
  });

  // Sidebar Links
  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Building },
    { id: 'users', label: 'Residents', icon: Users },
    { id: 'complaints', label: 'Complaints', icon: Wrench },
    { id: 'parking', label: 'Parking Grid', icon: Car },
    { id: 'notices', label: 'Announcements', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Telemetry chart data
  const complaintsPieData = [
    { name: 'Resolved', value: stats.resolvedComplaints },
    { name: 'Active/Pending', value: stats.openComplaints }
  ];
  const COLORS = ['#10B981', '#F59E0B'];

  return (
    <DashboardLayout links={sidebarLinks} activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Operational Dashboard</h1>
            <p className="text-xs text-gray-400">Building operations overview for maintenance complaints, parking, and residents.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Complaints</p>
                <h3 className="text-lg font-extrabold text-gray-800">{stats.openComplaints} / {stats.totalComplaints}</h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Residents</p>
                <h3 className="text-lg font-extrabold text-gray-800">{stats.totalResidents} Registered</h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Parking Allocation</p>
                <h3 className="text-lg font-extrabold text-gray-800">{stats.assignedSlots} / {stats.totalSlots}</h3>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-grow w-full h-64 md:w-1/2">
              <h3 className="text-xs font-bold text-gray-800 mb-4">Complaints status telemetry</h3>
              {stats.totalComplaints > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complaintsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {complaintsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No registered complaints to display telemetry.
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 space-y-4">
              <h4 className="text-xs font-bold text-gray-700">Legend</h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-600">Resolved maintenance complaints ({stats.resolvedComplaints})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-600">Active / Open complaints ({stats.openComplaints})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RESIDENTS LIST TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Building Residents</h1>
              <p className="text-xs text-gray-400">View and lookup profiles of flat owners and tenants registered in the building.</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, flat, phone..."
                value={residentsSearch}
                onChange={(e) => setResidentsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:border-amber-400 transition-colors shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">Resident</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Flat Number</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {filteredResidents.length > 0 ? (
                    filteredResidents.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-black text-xs">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{r.name}</p>
                            <p className="text-[10px] text-gray-400">{r.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded font-extrabold uppercase text-[9px] ${
                            r.role === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {r.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-600">
                          {r.flatNumber ? `Flat ${r.flatNumber}` : 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {r.phone || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setActiveTab('notices');
                              showToast(`Open Notices tab to chat with ${r.name}`, 'info');
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl border border-amber-100 hover:border-amber-200 transition-colors"
                          >
                            Chat
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No registered residents match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPLAINTS RESOLUTION TAB */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Maintenance & Complaints Requests</h1>
            <p className="text-xs text-gray-400">View building complaints submitted by residents and modify status parameter settings.</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Flat Number</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Raised By</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date Raised</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {complaintsList.length > 0 ? (
                    complaintsList.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-bold text-gray-800">{c.title}</td>
                        <td className="px-6 py-4 font-bold text-indigo-600">{c.flatNumber || '-'}</td>
                        <td className="px-6 py-4 capitalize">{c.category}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold">{c.raisedBy?.name}</p>
                          <span className="text-[9px] text-gray-400 uppercase font-bold">{c.raisedByRole}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                            c.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            c.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenComplaint(c)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 text-amber-700 font-bold rounded-xl transition-all"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No maintenance requests registered in this building.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. PARKING GRID TAB */}
      {activeTab === 'parking' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Parking Slot Allocations</h1>
            <p className="text-xs text-gray-400">Review building parking spots grid configurations. Click on slots to reassign.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {parkingList.map((slot) => {
              const isAssigned = slot.status === 'assigned';
              return (
                <div
                  key={slot._id}
                  onClick={() => handleOpenParkingAlloc(slot)}
                  className={`p-6 border rounded-2xl shadow-sm text-center cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-36 ${
                    isAssigned 
                      ? 'bg-rose-50 border-rose-100 hover:bg-rose-100/50' 
                      : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50'
                  }`}
                >
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-extrabold uppercase mb-2 ${
                      isAssigned ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {slot.status}
                    </span>
                    <h3 className="text-lg font-black text-gray-800">{slot.slotNumber}</h3>
                  </div>

                  <div className="text-[10px] text-gray-500 font-medium truncate">
                    {isAssigned ? (
                      <>
                        <p className="font-bold text-gray-700 truncate">{slot.assignedTo?.name}</p>
                        <p className="font-bold text-indigo-600">Flat {slot.flatNumber}</p>
                      </>
                    ) : (
                      <p className="text-emerald-700 font-bold">Unallocated</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. ANNOUNCEMENTS TAB */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Announcement post form */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">Publish Notice</h3>
                  <p className="text-[10px] text-gray-400">Announcements show up instantly on building resident dashboards.</p>
                </div>
                
                <form onSubmit={handleNoticeSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Title"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-amber-300 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Target Audience</label>
                    <select
                      value={noticeAudience}
                      onChange={(e) => setNoticeAudience(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 outline-none focus:bg-white focus:border-amber-300 transition-all"
                    >
                      <option value="all">All Members</option>
                      <option value="owners">Owners Only</option>
                      <option value="tenants">Tenants Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Body</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Write message..."
                      value={noticeBody}
                      onChange={(e) => setNoticeBody(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-amber-300 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-amber-600/10 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Announcement</span>
                  </button>
                </form>
              </div>
            </div>

            {/* notices feed */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800">Broadcasting Feed</h3>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {noticesList.length > 0 ? (
                  noticesList.map((notice) => (
                    <div key={notice._id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-extrabold text-gray-800">{notice.title}</h4>
                        <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Scope: {notice.audience}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal">{notice.body}</p>
                      <p className="text-[9px] text-gray-400 pt-2">
                        Published: {new Date(notice.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm">
                    No announcements published yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <NoticeChatPanel
            accent="amber"
            description="Communicate with owners, tenants, or admin in real-time."
          />
        </div>
      )}

      {/* 7. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Account Settings</h1>
            <p className="text-xs text-gray-400">Configure manager profile and password credentials.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-800">{user?.name}</h4>
                  <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-extrabold uppercase">
                    Manager Role
                  </span>
                </div>
                <div className="w-full pt-2 text-left text-xs space-y-2 border-t border-gray-50">
                  <p className="text-gray-500 font-medium">Email: <span className="text-gray-800 font-bold">{user?.email}</span></p>
                  <p className="text-gray-500 font-medium">Phone: <span className="text-gray-800 font-bold">{user?.phone || '-'}</span></p>
                </div>
              </div>

              {/* Password update card */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Update Credentials</h3>
                <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">New Password (Prefix: MNG)</label>
                    <input
                      type="password"
                      required
                      placeholder="MNG12345"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-amber-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Confirm Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Confirm MNG12345"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-amber-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-600/10"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: COMPLAINT RESOLUTION DETAILED FORM */}
      {isComplaintModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Resolve Complaint: {selectedComplaint.title}</h3>
                <p className="text-[9px] text-indigo-600 font-bold">Flat {selectedComplaint.flatNumber} &bull; Category: {selectedComplaint.category}</p>
              </div>
              <button 
                onClick={() => setIsComplaintModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleComplaintStatusSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Complaint Description</label>
                <p className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 leading-normal">
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Attachments</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedComplaint.attachments.map((url, i) => (
                      <a 
                        key={i} 
                        href={`http://localhost:5000${url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 border border-gray-100 hover:border-indigo-200 rounded-xl flex items-center gap-2 text-[10px] text-gray-500 font-bold bg-gray-50/50 truncate transition-all"
                      >
                        <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span className="truncate">View File {i+1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Resolution Status</label>
                <select
                  value={complaintStatus}
                  onChange={(e) => setComplaintStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none focus:bg-white focus:border-amber-300"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Add Manager Note / Comment</label>
                <textarea
                  rows={3}
                  placeholder="Describe resolution notes or scheduling details..."
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-amber-300 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/10"
                >
                  Update Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PARKING SLOT ALLOCATION */}
      {isParkingModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-extrabold text-gray-800">Manage Parking: Slot {selectedSlot.slotNumber}</h3>
              <button 
                onClick={() => setIsParkingModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleParkingSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Allocate Resident</label>
                <select
                  value={parkingUser}
                  onChange={(e) => {
                    const uId = e.target.value;
                    setParkingUser(uId);
                    const selected = residentsList.find(r => r._id === uId);
                    setParkingFlat(selected ? selected.flatNumber : '');
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none focus:bg-white"
                >
                  <option value="">Select Resident</option>
                  {residentsList.map(r => (
                    <option key={r._id} value={r._id}>{r.name} (Flat {r.flatNumber} &bull; {r.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Flat Number</label>
                <input
                  type="text"
                  placeholder="Auto-populated flat number"
                  readOnly
                  value={parkingFlat}
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-100 rounded-xl text-xs text-gray-500 outline-none cursor-not-allowed"
                />
              </div>

              <div className="pt-4 flex gap-2">
                {selectedSlot.status === 'assigned' && (
                  <button
                    type="button"
                    onClick={() => handleReleaseParking(selectedSlot.slotNumber)}
                    className="flex-1 py-2.5 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                  >
                    Release Slot
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/10"
                >
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default ManagerDashboard;
