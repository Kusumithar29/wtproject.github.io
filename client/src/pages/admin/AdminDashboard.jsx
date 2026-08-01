import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  CreditCard, 
  Wrench, 
  Bell, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  X, 
  FileText, 
  Car, 
  Printer, 
  TrendingUp, 
  ShieldCheck
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import useToast from '../../hooks/useToast';
import axiosInstance from '../../api/axiosInstance';
import DashboardLayout from '../../components/shared/DashboardLayout';
import NoticeChatPanel from '../../components/messaging/NoticeChatPanel';
import { validateName, validateEmail, validatePassword } from '../../utils/validators';
import { getOccupancyMode, getOccupancyBadgeClass, OCCUPANCY_LABELS, flatHasActiveTenant } from '../../utils/flatOccupancy';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { showToast } = useToast();

  // Overview stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFlats: 0,
    occupiedFlats: 0,
    openComplaints: 0,
    totalPayments: 0,
    pendingPayments: 0
  });

  // Data lists
  const [usersList, setUsersList] = useState([]);
  const [flatsList, setFlatsList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [noticesList, setNoticesList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [parkingList, setParkingList] = useState([]);

  // Selections for dropdowns
  const [ownersList, setOwnersList] = useState([]);
  const [tenantsList, setTenantsList] = useState([]);

  // UI state for Users CRUD
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  
  // User form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('tenant');
  const [userFlatNumber, setUserFlatNumber] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // UI state for Flats CRUD
  const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);
  const [flatNumber, setFlatNumber] = useState('');
  const [flatFloor, setFlatFloor] = useState('');
  const [flatArea, setFlatArea] = useState('');
  const [flatRent, setFlatRent] = useState('');
  const [flatStatus, setFlatStatus] = useState('vacant');

  // UI state for assigning flat owners/tenants
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignFlatNum, setAssignFlatNum] = useState('');
  const [assignOwner, setAssignOwner] = useState('');
  const [assignTenant, setAssignTenant] = useState('');
  const [assignRent, setAssignRent] = useState('');
  const [assignArea, setAssignArea] = useState('');
  const [assignOccupancyMode, setAssignOccupancyMode] = useState('vacant');

  // UI state for Notices
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeAudience, setNoticeAudience] = useState('all');

  // UI state for Parking Slots
  const [isParkingModalOpen, setIsParkingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [parkingUser, setParkingUser] = useState('');
  const [parkingFlat, setParkingFlat] = useState('');

  // UI state for Complaint Resolution
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState('open');
  const [managerNote, setManagerNote] = useState('');

  // UI Settings Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      // 1. Fetch Users
      const usersRes = await axiosInstance.get('/users?limit=200');
      if (usersRes.data.success) {
        setUsersList(usersRes.data.users);
        setOwnersList(usersRes.data.users.filter(u => u.role === 'owner'));
        setTenantsList(usersRes.data.users.filter(u => u.role === 'tenant'));
      }

      // 2. Fetch Flats
      const flatsRes = await axiosInstance.get('/flats');
      if (flatsRes.data.success) {
        setFlatsList(flatsRes.data.flats);
      }

      // 3. Fetch Payments
      const payRes = await axiosInstance.get('/payments/all');
      if (payRes.data.success) {
        setPaymentsList(payRes.data.payments);
      }

      // 4. Fetch Notices
      const noticeRes = await axiosInstance.get('/notices');
      if (noticeRes.data.success) {
        setNoticesList(noticeRes.data.notices);
      }

      // 5. Fetch Complaints
      const compRes = await axiosInstance.get('/complaints');
      if (compRes.data.success) {
        setComplaintsList(compRes.data.complaints);
      }

      // 6. Fetch Parking Slots
      const parkRes = await axiosInstance.get('/parking');
      if (parkRes.data.success) {
        setParkingList(parkRes.data.slots);
      }

    } catch (err) {
      console.error(err);
      showToast('Failed to load system telemetry data.', 'error');
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute stats on lists changes
  useEffect(() => {
    const rentedCount = flatsList.filter(f => flatHasActiveTenant(f)).length;
    const occupiedCount = flatsList.filter(f => getOccupancyMode(f) !== 'vacant').length;
    const paidSum = paymentsList
      .filter(p => p.status === 'paid')
      .reduce((sum, curr) => sum + curr.amount, 0);
    const pendingSum = paymentsList
      .filter(p => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, curr) => sum + curr.amount, 0);
    const activeComplaints = complaintsList.filter(c => c.status === 'open' || c.status === 'in-progress').length;

    setStats({
      totalUsers: usersList.length,
      totalFlats: flatsList.length,
      occupiedFlats: rentedCount,
      openComplaints: activeComplaints,
      totalPayments: paidSum,
      pendingPayments: pendingSum
    });
  }, [usersList, flatsList, paymentsList, complaintsList]);

  // Dump Users JSON
const handleDumpUsers = () => {
  const dataStr = JSON.stringify(usersList, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "users_dump.json";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  showToast("Users dump downloaded successfully!", "success");
};

// Dump Flats JSON
const handleDumpFlats = () => {
  const dataStr = JSON.stringify(flatsList, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "flats_dump.json";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  showToast("Flats dump downloaded successfully!", "success");
};

  // Open modal to create user
  const handleOpenCreateUser = () => {
    setIsEditingUser(false);
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserRole('tenant');
    setUserFlatNumber('');
    setUserPhone('');
    setIsUserModalOpen(true);
  };

  // Open modal to edit user
  const handleOpenEditUser = (u) => {
    setIsEditingUser(true);
    setEditingUserId(u._id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserPassword('');
    setUserRole(u.role);
    setUserFlatNumber(u.flatNumber || '');
    setUserPhone(u.phone || '');
    setIsUserModalOpen(true);
  };

  // Submit User Form (Create or Update)
  const handleUserSubmit = async (e) => {
  e.preventDefault();

  if (!validateName(userName)) {
    showToast(
      'Name must contain only alphabets (no spaces, numbers or special characters).',
      'error'
    );
    return;
  }

  if (!validateEmail(userEmail)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  // Password mandatory for NEW USER
  if (!isEditingUser && !userPassword.trim()) {
    showToast('Password is required.', 'error');
    return;
  }

  // Validate password
  if (!isEditingUser || userPassword.trim()) {
    const passCheck = validatePassword(userPassword, userRole);

    if (!passCheck.isValid) {
      showToast(passCheck.message, 'error');
      return;
    }
  }

  if (userRole === 'tenant' && !userFlatNumber.trim()) {
    showToast(
      'Flat number is required for tenants (current rental unit).',
      'error'
    );
    return;
  }

 try {
  const payload = {
    name: userName.trim(),
    email: userEmail.trim().toLowerCase(),
    password: userPassword.trim(),  // ✅ ADD THIS LINE
    role: userRole,
    flatNumber: 
      userRole === 'tenant'
        ? userFlatNumber
        : userRole === 'owner'
        ? userFlatNumber || null
        : null,
    phone: userPhone
  };

  let res;

  if (isEditingUser) {
    // For edits, only include password if user enters a new one
    if (!userPassword.trim()) {
      delete payload.password;
    }
    res = await axiosInstance.put(`/users/${editingUserId}`, payload);
  } else {
    res = await axiosInstance.post('/users', payload);
  }

    if (res.data.success) {
      showToast(
        isEditingUser
          ? 'User account updated successfully!'
          : 'User account created successfully!',
        'success'
      );

      setIsUserModalOpen(false);

      // Clear form
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setUserPhone('');
      setUserFlatNumber('');
      setUserRole('tenant');

      loadDashboardData();
    }
  } catch (err) {
    console.error(err);

    showToast(
      err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to save user account.',
      'error'
    );
  }
};
  // Delete User
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
    try {
      const res = await axiosInstance.delete(`/users/${id}`);
      if (res.data.success) {
        showToast('User deleted successfully!', 'success');
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  // Create Flat
  const handleFlatSubmit = async (e) => {
    e.preventDefault();
    if (!flatNumber.trim() || !flatFloor || !flatArea || !flatRent) {
      showToast('Please fill out all flat details.', 'error');
      return;
    }

    try {
      const res = await axiosInstance.post('/flats', {
        flatNumber,
        floor: Number(flatFloor),
        area: Number(flatArea),
        monthlyRent: Number(flatRent),
        status: flatStatus
      });

      if (res.data.success) {
        showToast('Flat registered successfully!', 'success');
        setIsFlatModalOpen(false);
        setFlatNumber('');
        setFlatFloor('');
        setFlatArea('');
        setFlatRent('');
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to register flat.', 'error');
    }
  };

  // Open Assign Modal
  const handleOpenAssign = (flat) => {
    setAssignFlatNum(flat.flatNumber);
    setAssignOwner(flat.ownerUserId?._id || '');
    setAssignTenant(flat.tenantUserId?._id || '');
    setAssignRent(flat.monthlyRent || '');
    setAssignArea(flat.area || '');
    setAssignOccupancyMode(getOccupancyMode(flat));
    setIsAssignModalOpen(true);
  };

  // Submit Flat Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.put(`/flats/${assignFlatNum}`, {
        ownerUserId: assignOwner || null,
        tenantUserId: assignTenant || null,
        monthlyRent: Number(assignRent),
        area: Number(assignArea),
        ...(assignTenant ? {} : { occupancyMode: assignOccupancyMode })
      });

      if (res.data.success) {
        showToast('Flat assignments updated!', 'success');
        setIsAssignModalOpen(false);
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update assignments.', 'error');
    }
  };

  // Create Notice
  const handleNoticeSubmit = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      showToast('Title and Body are required for announcements.', 'error');
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
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post notice.', 'error');
    }
  };

  // Manage Parking Slots
  const handleOpenParkingAlloc = (slot) => {
    setSelectedSlot(slot);
    setParkingUser(slot.assignedTo?._id || '');
    setParkingFlat(slot.flatNumber || '');
    setIsParkingModalOpen(true);
  };

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
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to allocate parking slot.', 'error');
    }
  };

  const handleReleaseParking = async (slotNumber) => {
    if (!window.confirm(`Are you sure you want to release parking slot ${slotNumber}?`)) return;
    try {
      const res = await axiosInstance.put(`/parking/${slotNumber}/release`);
      if (res.data.success) {
        showToast('Parking slot released successfully!', 'success');
        setIsParkingModalOpen(false);
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to release parking slot.', 'error');
    }
  };

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
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update complaint status.', 'error');
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

    const check = validatePassword(newPassword, 'admin');
    if (!check.isValid) {
      showToast(check.message, 'error');
      return;
    }

    try {
      // Mock change password or endpoint
      showToast('Password updated successfully! (Role Prefix ADM Enforced)', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast('Failed to update password.', 'error');
    }
  };

  const handlePrintReports = () => {
    window.print();
  };

  // Filtered Users List
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.flatNumber && u.flatNumber.includes(userSearch));
    const matchesRole = userRoleFilter ? u.role === userRoleFilter : true;
    return matchesSearch && matchesRole;
  });

  // Sidebar Links
  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Building },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'flats', label: 'Flat Registry', icon: FileText },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'complaints', label: 'Complaints', icon: Wrench },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Dummy Chart Data
  const monthlyRevenueData = [
    { name: 'Jan', revenue: 45000 },
    { name: 'Feb', revenue: 52000 },
    { name: 'Mar', revenue: 49000 },
    { name: 'Apr', revenue: 60000 },
    { name: 'May', revenue: stats.totalPayments || 60000 }
  ];

  const complaintsPieData = [
    { name: 'Open', value: stats.openComplaints },
    { name: 'Resolved', value: complaintsList.filter(c => c.status === 'resolved').length }
  ];

  const COLORS = ['#F43F5E', '#10B981'];

  return (
    <DashboardLayout links={sidebarLinks} activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Control Center</h1>
              <p className="text-xs text-gray-400">Overview of building telemetry, financial status and registrations.</p>
            </div>
            <button 
              onClick={handleOpenCreateUser}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
          

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Users</p>
                <h3 className="text-lg font-extrabold text-gray-800">{stats.totalUsers}</h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Flats</p>
                <h3 className="text-lg font-extrabold text-gray-800">{stats.totalFlats}</h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Open Complaints</p>
                <h3 className="text-lg font-extrabold text-gray-800 text-rose-600">{stats.openComplaints}</h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Payments This Month</p>
                <h3 className="text-lg font-extrabold text-gray-800">₹{stats.totalPayments.toLocaleString('en-IN')}</h3>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Collected Rent Telemetry</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                    <YAxis stroke="#9CA3AF" fontSize={11} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#F43F5E" radius={[8, 8, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-4">Complaints Telemetry</h3>
                <div className="h-44 relative">
                  {stats.openComplaints + complaintsList.filter(c => c.status === 'resolved').length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={complaintsPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
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
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                      No complaints submitted.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-50 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Open Tickets:</span>
                  <span className="font-bold text-rose-600">{stats.openComplaints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved Tickets:</span>
                  <span className="font-bold text-emerald-600">
                    {complaintsList.filter(c => c.status === 'resolved').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGE USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Manage Users</h1>
              <p className="text-xs text-gray-400">Create, edit, and audit system credentials for residents and management.</p>
            </div>
            <div className="flex gap-2">
  <button
    onClick={handleDumpUsers}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
  >
    Dump Users
  </button>

  <button
    onClick={handleOpenCreateUser}
    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
  >
    <Plus className="w-4 h-4" />
    <span>Create Account</span>
  </button>
</div>

          </div>

          {/* Search & Filter */}
          <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-grow w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, email or flat..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:border-rose-300 transition-all"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 outline-none w-full sm:w-44 focus:bg-white focus:border-rose-300"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Password</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Flat Number</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-800">{u.name}</td>
                        <td className="px-6 py-4">{u.email}</td>
                        <td className="px-6 py-4 font-mono text-gray-600 font-bold bg-gray-50/50 rounded px-1.5 py-0.5">{u.plainPassword || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                            u.role === 'admin' ? 'bg-rose-100 text-rose-800' :
                            u.role === 'manager' ? 'bg-amber-100 text-amber-800' :
                            u.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                            'bg-teal-100 text-teal-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-rose-600">{u.flatNumber || '-'}</td>
                        <td className="px-6 py-4">{u.phone || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Edit user details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {u.email !== 'admin@vastusetu.com' && (
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete user account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No registered users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. FLAT REGISTRY TAB */}
      {activeTab === 'flats' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Flat Registry</h1>
              <p className="text-xs text-gray-400">Register new apartment units and associate residents (owners/tenants).</p>
            </div>
            <div className="flex gap-2">
  <button
    onClick={handleDumpFlats}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
  >
    Dump Flats
  </button>

  <button
    onClick={() => setIsFlatModalOpen(true)}
    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
  >
    <Plus className="w-4 h-4" />
    <span>Register Flat</span>
  </button>
</div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flatsList.length > 0 ? (
              flatsList.map((flat) => (
                <div key={flat._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">Flat {flat.flatNumber}</h3>
                      <p className="text-[10px] text-gray-400 font-bold">Floor {flat.floor} &bull; {flat.area} Sq Ft</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${getOccupancyBadgeClass(getOccupancyMode(flat))}`}>
                      {getOccupancyMode(flat).replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-semibold">Owner (purchased):</span>
                      <span className="text-gray-800 font-bold">{flat.ownerUserId?.name || 'Not Assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-semibold">Tenant (renter):</span>
                      <span className="text-gray-800 font-bold">
                        {flatHasActiveTenant(flat) ? flat.tenantUserId?.name : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-semibold">Monthly rent:</span>
                      <span className="text-gray-800 font-bold">₹{flat.monthlyRent.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAssign(flat)}
                    className="w-full py-2 border border-gray-100 hover:border-rose-100 text-rose-600 hover:bg-rose-50/50 text-[11px] font-bold rounded-xl transition-all"
                  >
                    Manage Assignments
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm">
                No flats registered in this building.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ACCOUNTS TAB */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Financial Ledger</h1>
            <p className="text-xs text-gray-400">Ledger history of rent bills generated, collected, or outstanding.</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4">Flat</th>
                    <th className="px-6 py-4">Tenant</th>
                    <th className="px-6 py-4">Owner</th>
                    <th className="px-6 py-4">Bill Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Payment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {paymentsList.length > 0 ? (
                    paymentsList.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-800">{p.month}/{p.year}</td>
                        <td className="px-6 py-4 font-bold text-rose-600">{p.flatNumber}</td>
                        <td className="px-6 py-4">{p.tenantId?.name || 'Tenant'}</td>
                        <td className="px-6 py-4">{p.ownerId?.name || 'Owner'}</td>
                        <td className="px-6 py-4 font-bold">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                            p.status === 'paid' ? 'bg-green-100 text-green-800' :
                            p.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No rent payments are recorded under this building accounts registry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. PARKING TAB */}
      {activeTab === 'parking' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Parking Slot Management</h1>
            <p className="text-xs text-gray-400">Manage building parking spots grid configurations. Click on slots to assign.</p>
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
                        <p className="font-bold text-rose-600">Flat {slot.flatNumber}</p>
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

      {/* 6. COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Complaints Tickets</h1>
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
            
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {complaintsList.length > 0 ? (
                    complaintsList.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-bold text-gray-800">{c.title}</td>
                        <td className="px-6 py-4 font-bold text-rose-600">{c.flatNumber || '-'}</td>
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

      {/* 7. REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-6 print-receipt-container">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              .print-receipt-container, .print-receipt-container * {
                visibility: visible !important;
              }
              .print-receipt-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 24px !important;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          <div className="flex justify-between items-center no-print">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Operational & Financial Reports</h1>
              <p className="text-xs text-gray-400">Generate, review, and print detailed building performance parameters.</p>
            </div>
            
          </div>

          {/* Printable Report Header */}
          <div className="hidden print:flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
            <div>
              <h1 className="text-2xl font-black text-rose-600">VASTUSETU RESIDENCY</h1>
              <p className="text-xs text-gray-500 mt-1">Smart Living & Simplified Property Management Report</p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Report Date: {new Date().toLocaleDateString('en-IN')}</p>
              <p>Generated By: Super Admin (VastuSetu Portal)</p>
            </div>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Registered Flats</span>
              <span className="text-lg font-black text-gray-800 block mt-1">{stats.totalFlats} Flats</span>
            </div>
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Occupancy Rate</span>
              <span className="text-lg font-black text-gray-800 block mt-1">
                {stats.totalFlats > 0 ? Math.round((stats.occupiedFlats / stats.totalFlats) * 100) : 0}% Occupied
              </span>
            </div>
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Collected Cash</span>
              <span className="text-lg font-black text-emerald-600 block mt-1">₹{stats.totalPayments.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Outstanding Dues</span>
              <span className="text-lg font-black text-rose-600 block mt-1">₹{stats.pendingPayments.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Report Data Details */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">
              Flats Inventory Registry List
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-2">Flat Number</th>
                  <th className="py-2">Floor</th>
                  <th className="py-2">Rent / Mo</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Assigned Owner</th>
                  <th className="py-2">Assigned Tenant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flatsList.map(f => (
                  <tr key={f._id} className="py-2">
                    <td className="py-2 font-bold text-indigo-600">{f.flatNumber}</td>
                    <td className="py-2">Floor {f.floor}</td>
                    <td className="py-2 font-semibold">₹{f.monthlyRent}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                        f.status === 'occupied' ? 'bg-indigo-50 text-indigo-800' : 'bg-green-50 text-green-800'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-2 font-semibold">{f.ownerUserId?.name || '-'}</td>
                    <td className="py-2 font-semibold">{f.tenantUserId?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. ANNOUNCEMENTS TAB */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Create Announcement Form */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">Publish Announcement</h3>
                  <p className="text-[10px] text-gray-400">Circular notifications are immediately broadcasted to residents in real-time.</p>
                </div>
                
                <form onSubmit={handleNoticeSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Notice Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Utility Maintenance Alert"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-rose-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Audience Scope</label>
                    <select
                      value={noticeAudience}
                      onChange={(e) => setNoticeAudience(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 outline-none focus:bg-white focus:border-rose-300"
                    >
                      <option value="all">Everyone</option>
                      <option value="owners">Owners Only</option>
                      <option value="tenants">Tenants Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Body Description</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Write message details..."
                      value={noticeBody}
                      onChange={(e) => setNoticeBody(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-rose-300 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/10 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Notice</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Published Notices Feed */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800">Circulars Feed</h3>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {noticesList.length > 0 ? (
                  noticesList.map((notice) => (
                    <div key={notice._id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-600"></div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-extrabold text-gray-800">{notice.title}</h4>
                        <span className="text-[9px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-bold uppercase">
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
                  <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
                    No announcements posted.
                  </div>
                )}
              </div>
            </div>
          </div>

          <NoticeChatPanel
            accent="rose"
            description="Communicate with managers, owners, or tenants in real-time."
          />
        </div>
      )}

      {/* 9. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Account Control Settings</h1>
            <p className="text-xs text-gray-400">Update your admin profile and password credentials.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
            <div className="space-y-6">
              {/* Profile Card Info */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Admin Account Info</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-rose-600 text-white font-extrabold text-sm flex items-center justify-center">
                    SA
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-800">Super Admin</h4>
                    <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-extrabold uppercase">
                      Admin Role
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-xs pt-4 border-t border-gray-50">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="font-semibold text-gray-800">admin@vastusetu.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone:</span>
                    <span className="font-semibold text-gray-800">9876543210</span>
                  </div>
                </div>
              </div>

              {/* Change Password Form */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Update Credentials</h3>
                <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">New Password (Prefix: ADM)</label>
                    <input
                      type="password"
                      required
                      placeholder="ADM12345"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Confirm Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Confirm ADM12345"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all"
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
      {/* MODAL: USER CREATE/EDIT DRAWER */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-extrabold text-gray-800">
                {isEditingUser ? 'Edit User Account' : 'Create User Account'}
              </h3>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Select Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  disabled={isEditingUser}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none"
                >
                  <option value="tenant">Tenant</option>
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Only alphabets, NO spaces (e.g. RaviKumar)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <label className="text-[11px] font-semibold text-gray-400">
                    {isEditingUser ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <span className="text-[8px] text-rose-600 font-extrabold uppercase">
                    Prefix: {userRole.substring(0, 3).toUpperCase()} &bull; Length &gt; 6
                  </span>
                </div>
                <input
                  type="password"
                  required={!isEditingUser}
                  placeholder={`${userRole.substring(0, 3).toUpperCase()}123456`}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>

              {userRole === 'tenant' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Rented Flat Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101"
                    value={userFlatNumber}
                    onChange={(e) => setUserFlatNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                  />
                </div>
              )}

              {userRole === 'owner' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Residing Flat (optional)</label>
                  <input
                    type="text"
                    placeholder="Only if owner lives in a unit (self-occupied)"
                    value={userFlatNumber}
                    onChange={(e) => setUserFlatNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                  />
                  <p className="text-[9px] text-gray-400">Ownership is assigned per flat in Flat Registry, not here.</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FLAT REGISTRATION */}
      {isFlatModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-extrabold text-gray-800">Register Property</h3>
              <button 
                onClick={() => setIsFlatModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFlatSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Flat Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Floor</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1"
                  value={flatFloor}
                  onChange={(e) => setFlatFloor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Area (Sq Ft)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1200"
                  value={flatArea}
                  onChange={(e) => setFlatArea(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Monthly Rent (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={flatRent}
                  onChange={(e) => setFlatRent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Flat Status</label>
                <select
                  value={flatStatus}
                  onChange={(e) => setFlatStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none"
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFlatModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN RESIDENTS */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-extrabold text-gray-800">Assign Members: Flat {assignFlatNum}</h3>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Flat Owner</label>
                <select
                  value={assignOwner}
                  onChange={(e) => setAssignOwner(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none"
                >
                  <option value="">No Owner Assigned</option>
                  {ownersList.map(o => (
                    <option key={o._id} value={o._id}>{o.name} ({o.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Tenant (temporary renter)</label>
                <select
                  value={assignTenant}
                  onChange={(e) => setAssignTenant(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none"
                >
                  <option value="">No tenant — not rented</option>
                  {tenantsList.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Rent (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="Rent"
                  value={assignRent}
                  onChange={(e) => setAssignRent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Area (Sq Ft)</label>
                <input
                  type="number"
                  required
                  placeholder="Area"
                  value={assignArea}
                  onChange={(e) => setAssignArea(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none"
                />
              </div>

              {!assignTenant && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Occupancy (no tenant)</label>
                  <select
                    value={assignOccupancyMode}
                    onChange={(e) => setAssignOccupancyMode(e.target.value)}
                    disabled={!assignOwner}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none"
                  >
                    <option value="vacant">{OCCUPANCY_LABELS.vacant}</option>
                    <option value="self_occupied">{OCCUPANCY_LABELS.self_occupied}</option>
                  </select>
                  <p className="text-[9px] text-gray-400">Assign a tenant with or without an owner (society lease if no owner).</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Save assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPLAINT RESOLUTION DETAIL */}
      {isComplaintModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Resolve Complaint</h3>
                <p className="text-[9px] text-rose-600 font-bold">Flat {selectedComplaint.flatNumber} &bull; Category: {selectedComplaint.category}</p>
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
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.attachments.map((url, i) => (
                      <a 
                        key={i} 
                        href={`http://localhost:5000${url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-16 h-16 rounded-xl border border-gray-100 overflow-hidden hover:opacity-85 transition-opacity inline-block"
                      >
                        <img 
                          src={`http://localhost:5000${url}`} 
                          alt="Complaint attachment" 
                          className="w-full h-full object-cover"
                        />
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Manager Note / Comment</label>
                <textarea
                  rows={3}
                  placeholder="Describe resolution notes or scheduling details..."
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/10"
                >
                  Update Ticket
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
              <h3 className="text-sm font-extrabold text-gray-800">Allocate Parking Slot: {selectedSlot.slotNumber}</h3>
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
                    const selected = usersList.find(r => r._id === uId);
                    setParkingFlat(selected ? selected.flatNumber : '');
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none"
                >
                  <option value="">Select Resident</option>
                  {usersList.filter(u => u.role === 'owner' || u.role === 'tenant').map(r => (
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
                    className="flex-grow py-2.5 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                  >
                    Release Slot
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-grow py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
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

export default AdminDashboard;
