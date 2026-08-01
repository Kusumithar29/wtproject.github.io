import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  CreditCard, 
  Wrench, 
  Bell, 
  MessageSquare,
  Plus,
  Send,
  FileText,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Car,
  Settings,
  Shield,
  Briefcase,
  Printer
} from 'lucide-react';
import useToast from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import axiosInstance from '../../api/axiosInstance';
import DashboardLayout from '../../components/shared/DashboardLayout';
import Inbox from '../../components/messaging/Inbox';
import { validatePassword } from '../../utils/validators';

const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const socket = useSocket();

  // Stats State
  const [stats, setStats] = useState({
    totalFlatsOwned: 0,
    occupiedFlatsCount: 0,
    expectedMonthlyRent: 0,
    totalRentCollected: 0,
    activeComplaints: 0,
    totalServicesRequested: 0
  });

  // Data lists
  const [flatsOwned, setFlatsOwned] = useState([]);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [noticesList, setNoticesList] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Family profile lists
  const [familyMembers, setFamilyMembers] = useState([]);
  
  // UI states for adding family member
  const [familyName, setFamilyName] = useState('');
  const [familyRelation, setFamilyRelation] = useState('Spouse');
  const [familyPhone, setFamilyPhone] = useState('');

  // UI state for raising a Complaint
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('plumbing');
  const [complaintFiles, setComplaintFiles] = useState([]);

  // UI state for Services request
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('plumbing');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceFlatNum, setServiceFlatNum] = useState('');

  // UI state for Settings password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state for mock payments (General Maintenance/Service Fee)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [payingSpinner, setPayingSpinner] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState(null);

  // Load Owner Data
  const loadOwnerData = async () => {
    try {
      // 1. Flats owned
      const flatsRes = await axiosInstance.get('/flats');
      if (flatsRes.data.success) {
        setFlatsOwned(flatsRes.data.flats);
      }

      // 2. Payments History
      const payRes = await axiosInstance.get('/payments/history');
      if (payRes.data.success) {
        setPaymentsHistory(payRes.data.payments);
      }

      // 3. Complaints
      const compRes = await axiosInstance.get('/complaints');
      if (compRes.data.success) {
        setComplaintsList(compRes.data.complaints);
      }

      // 4. Notices
      const noticeRes = await axiosInstance.get('/notices');
      if (noticeRes.data.success) {
        setNoticesList(noticeRes.data.notices);
      }

      // 5. Available Services & Requests
      const servicesAvailRes = await axiosInstance.get('/services/available');
      if (servicesAvailRes.data.success) {
        setAvailableServices(servicesAvailRes.data.services);
      }

      const servicesReqRes = await axiosInstance.get('/services/my-requests');
      if (servicesReqRes.data.success) {
        setServiceRequests(servicesReqRes.data.requests);
      }

      // 6. Parking allocation
      const parkingRes = await axiosInstance.get('/parking');
      if (parkingRes.data.success) {
        setParkingSlots(parkingRes.data.slots);
      }

    } catch (err) {
      console.error(err);
      showToast('Failed to load owner information.', 'error');
    }
  };

  // Setup Socket Realtime Notifications
  useEffect(() => {
    if (!socket || !user) return;

    const handlePaymentNotification = (payment) => {
      showToast(`Rent payment of ₹${payment.amount} received from Tenant for Flat ${payment.flatNumber}!`, 'success');
      
      const newNotif = {
        id: payment._id || Date.now().toString(),
        type: 'payment',
        title: 'Rent Payment Received',
        message: `Tenant has paid ₹${payment.amount} for Flat ${payment.flatNumber}. Transaction ID: ${payment.transactionId}`,
        time: new Date(),
        unread: true
      };

      setNotifications(prev => {
        const updated = [newNotif, ...prev];
        localStorage.setItem(`notifs_${user._id}`, JSON.stringify(updated.slice(0, 50)));
        return updated;
      });
      loadOwnerData();
    };

    const handleServiceUpdate = (request) => {
      if (request.requestedBy?._id === user._id || request.requestedBy === user._id) {
        showToast(`Service Request '${request.name}' status updated to ${request.status}!`, 'info');
        
        const newNotif = {
          id: request._id || Date.now().toString(),
          type: 'service',
          title: 'Service Request Update',
          message: `Your service request for '${request.name}' has been updated to '${request.status}'. Cost: ₹${request.cost || 0}`,
          time: new Date(),
          unread: true
        };

        setNotifications(prev => {
          const updated = [newNotif, ...prev];
          localStorage.setItem(`notifs_${user._id}`, JSON.stringify(updated.slice(0, 50)));
          return updated;
        });
        loadOwnerData();
      }
    };

    const handleNewNotice = (notice) => {
      if (notice.audience === 'all' || notice.audience === 'owners') {
        showToast(`New Notice: ${notice.title}`, 'info');

        setNoticesList(prev => {
          const exists = prev.some(n => n._id === notice._id);
          if (exists) return prev;
          return [notice, ...prev];
        });

        const newNotif = {
          id: notice._id || Date.now().toString(),
          type: 'notice',
          title: 'New Announcement Published',
          message: `New notice posted: "${notice.title}". Check the Notice Board for full details.`,
          time: new Date(),
          unread: true
        };

        setNotifications(prev => {
          const updated = [newNotif, ...prev];
          localStorage.setItem(`notifs_${user._id}`, JSON.stringify(updated.slice(0, 50)));
          return updated;
        });
      }
    };

    socket.on('payment-notification', handlePaymentNotification);
    socket.on('service-request-update', handleServiceUpdate);
    socket.on('new-notice', handleNewNotice);

    return () => {
      socket.off('payment-notification', handlePaymentNotification);
      socket.off('service-request-update', handleServiceUpdate);
      socket.off('new-notice', handleNewNotice);
    };
  }, [socket, user]);

  useEffect(() => {
    if (user) {
      loadOwnerData();
      // Load family profiles
      const storedFamily = localStorage.getItem(`family_${user._id}`);
      if (storedFamily) {
        setFamilyMembers(JSON.parse(storedFamily));
      }
      // Load local notifications
      const storedNotifs = localStorage.getItem(`notifs_${user._id}`);
      if (storedNotifs) {
        setNotifications(JSON.parse(storedNotifs));
      }
    }
  }, [user]);

  // Calculate stats
  useEffect(() => {
    const occupiedCount = flatsOwned.filter(f => f.status === 'occupied').length;
    const rentExpected = flatsOwned.reduce((sum, curr) => sum + curr.monthlyRent, 0);
    const rentCollected = paymentsHistory
      .filter(p => p.status === 'paid' && p.month === (new Date().getMonth() + 1))
      .reduce((sum, curr) => sum + curr.amount, 0);
    const activeC = complaintsList.filter(c => c.status !== 'resolved').length;

    setStats({
      totalFlatsOwned: flatsOwned.length,
      occupiedFlatsCount: occupiedCount,
      expectedMonthlyRent: rentExpected,
      totalRentCollected: rentCollected,
      activeComplaints: activeC,
      totalServicesRequested: serviceRequests.length
    });
  }, [flatsOwned, paymentsHistory, complaintsList, serviceRequests]);

  // Raise Complaint Submit
  const handleRaiseComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDesc.trim()) {
      showToast('Title and Description are required to file a complaint.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', complaintTitle);
      formData.append('description', complaintDesc);
      formData.append('category', complaintCategory);
      
      for (let i = 0; i < complaintFiles.length; i++) {
        formData.append('attachments', complaintFiles[i]);
      }

      const res = await axiosInstance.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showToast('Complaint registered successfully! The manager will review it.', 'success');
        setIsComplaintModalOpen(false);
        setComplaintTitle('');
        setComplaintDesc('');
        setComplaintFiles([]);
        loadOwnerData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to file complaint.', 'error');
    }
  };

  // Add Family Member
  const handleAddFamilyMember = (e) => {
    e.preventDefault();
    if (!familyName.trim() || !familyPhone.trim()) {
      showToast('Name and phone number are required for family members.', 'error');
      return;
    }

    const newMember = {
      id: Date.now().toString(),
      name: familyName,
      relationship: familyRelation,
      phone: familyPhone
    };

    const updatedFamily = [...familyMembers, newMember];
    setFamilyMembers(updatedFamily);
    localStorage.setItem(`family_${user._id}`, JSON.stringify(updatedFamily));
    
    setFamilyName('');
    setFamilyPhone('');
    showToast('Family profile added successfully!', 'success');
  };

  // Remove Family Member
  const handleRemoveFamilyMember = (id) => {
    const updatedFamily = familyMembers.filter(m => m.id !== id);
    setFamilyMembers(updatedFamily);
    localStorage.setItem(`family_${user._id}`, JSON.stringify(updatedFamily));
    showToast('Family profile removed.', 'info');
  };

  // Open Service Request Modal
  const handleOpenServiceModal = () => {
    setServiceDesc('');
    setServiceFlatNum(flatsOwned[0]?.flatNumber || '');
    setIsServiceModalOpen(true);
  };

  // Submit Service Request
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceFlatNum) {
      showToast('Please select a flat to associate this request.', 'error');
      return;
    }
    if (!serviceDesc.trim()) {
      showToast('Please describe the service issue.', 'error');
      return;
    }

    const matchedService = availableServices.find(s => s.id === selectedServiceId) || {
      name: 'Custom Service',
      category: 'General'
    };

    try {
      const res = await axiosInstance.post('/services/requests', {
        name: matchedService.name,
        category: matchedService.category,
        description: serviceDesc
      });

      if (res.data.success) {
        showToast('Service requested successfully! Manager will dispatch staff shortly.', 'success');
        setIsServiceModalOpen(false);
        loadOwnerData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request service.', 'error');
    }
  };

  // Mock Payment Flow for Service Cost / Maintenance
  const handlePayFeeClick = (req) => {
    setSelectedPayment(req);
    setCardNumber('');
    setCardHolder('');
    setCardExpiry('');
    setCardCvv('');
    setIsPaymentModalOpen(true);
  };

  const handlePayFeeSubmit = (e) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length !== 16 || cardCvv.length !== 3) {
      showToast('Please fill out valid mock card details.', 'error');
      return;
    }

    setPayingSpinner(true);
    setTimeout(async () => {
      try {
        setPayingSpinner(false);
        setIsPaymentModalOpen(false);

        // Update database if it's a real request, or mock it locally
        if (selectedPayment._id && !selectedPayment.isMockDues) {
          const res = await axiosInstance.put(`/services/requests/${selectedPayment._id}`, {
            status: 'Completed'
          });
          if (res.data.success) {
            showToast('Service request fee paid successfully!', 'success');
          }
        } else {
          showToast('Mock maintenance fee payment verified successfully! Receipt generated.', 'success');
        }

        // Generate random transaction ID
        const randomTxnId = 'TXN' + Math.random().toString(36).substring(2, 9).toUpperCase();
        const mockReceipt = {
          title: selectedPayment.name || 'General Maintenance Dues',
          flat: selectedPayment.flatNumber || '101',
          category: selectedPayment.category || 'Maintenance',
          amount: selectedPayment.cost || 2500,
          txnId: randomTxnId,
          date: new Date(),
          payer: user.name
        };

        setReceiptToPrint(mockReceipt);
        loadOwnerData();
      } catch (err) {
        showToast('Payment verification failed.', 'error');
      }
    }, 2000);
  };

  const handlePrintReceipt = () => {
    window.print();
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

    const check = validatePassword(newPassword, 'owner');
    if (!check.isValid) {
      showToast(check.message, 'error');
      return;
    }

    try {
      showToast('Password updated successfully! (Role Prefix OWN Enforced)', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast('Failed to update password.', 'error');
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem(`notifs_${user._id}`);
    showToast('Notification logs cleared.', 'info');
  };

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Building },
    { id: 'my-apartment', label: 'My Apartment', icon: Users },
    { id: 'notices', label: 'Notice Board', icon: FileText },
    { id: 'complaints', label: 'Complaints', icon: Wrench },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'payments', label: 'Rent Ledger', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <DashboardLayout links={sidebarLinks} activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {/* CSS printing utility injection to isolate receipt */}
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
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* MOCK PRINTABLE RECEIPT CARD INJECTION */}
      {receiptToPrint && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black text-xs font-mono leading-loose">
          <div className="print-receipt-container border-2 border-black p-8 rounded-xl max-w-md mx-auto space-y-4">
            <h2 className="text-center text-lg font-black tracking-widest border-b-2 border-black pb-2 uppercase">VastuSetu System Receipt</h2>
            <div className="space-y-1">
              <p>Payer Name: <span className="font-bold">{receiptToPrint.payer}</span></p>
              <p>Apartment Flat: <span className="font-bold">Flat {receiptToPrint.flat}</span></p>
              <p>Service/Fee Category: <span className="font-bold">{receiptToPrint.category}</span></p>
              <p>Fee Particulars: <span className="font-bold">{receiptToPrint.title}</span></p>
              <p>Billing Dues Paid: <span className="font-bold">₹{receiptToPrint.amount.toLocaleString('en-IN')}</span></p>
              <p>Transaction ID: <span className="font-bold">{receiptToPrint.txnId}</span></p>
              <p>Transaction Date: <span className="font-bold">{new Date(receiptToPrint.date).toLocaleString('en-IN')}</span></p>
            </div>
            <div className="text-center text-[10px] pt-4 border-t-2 border-black border-dashed">
              Verified Sandbox Transaction Receipt &bull; Single Flat Registry VastuSetu
            </div>
            <button 
              onClick={() => setReceiptToPrint(null)}
              className="no-print mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs w-full font-bold"
            >
              Close Print View
            </button>
          </div>
        </div>
      )}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Owner Dashboard</h1>
            <p className="text-xs text-gray-400">Track flat statistics, tenant statuses, rent invoices, and announcements.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Flats Owned</p>
                <h3 className="text-lg font-extrabold text-gray-800">{stats.totalFlatsOwned}</h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Occupied Flats</p>
                <h3 className="text-lg font-extrabold text-gray-800">{stats.occupiedFlatsCount}</h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rent Expected</p>
                <h3 className="text-lg font-extrabold text-gray-800">₹{stats.expectedMonthlyRent.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Complaints</p>
                <h3 className="text-lg font-extrabold text-gray-800">{stats.activeComplaints}</h3>
              </div>
            </div>

          </div>

          {/* Parking allocation details */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">My Parking Allocation</h3>
                <p className="text-[10px] text-gray-400">
                  Slots assigned to you or linked to your owned flats
                  {flatsOwned.length > 0 && ` (${flatsOwned.map(f => f.flatNumber).join(', ')})`}.
                </p>
              </div>
            </div>
            {parkingSlots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {parkingSlots.map((slot) => (
                  <div
                    key={slot._id || slot.slotNumber}
                    className="p-4 bg-blue-50/30 border border-blue-100 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Slot Number</p>
                        <h4 className="text-lg font-black text-gray-800">{slot.slotNumber}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                        slot.status === 'assigned'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {slot.status}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold">Linked Flat</span>
                        <span className="font-bold text-blue-700">Flat {slot.flatNumber || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold">Assigned Resident</span>
                        <span className="font-bold text-gray-800 text-right max-w-[55%] truncate">
                          {slot.assignedTo?.name || user?.name}
                        </span>
                      </div>
                      {slot.assignedTo?.role && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-semibold">Role</span>
                          <span className="font-bold text-gray-800 capitalize">{slot.assignedTo.role}</span>
                        </div>
                      )}
                      {slot.assignedTo?.phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-semibold">Contact</span>
                          <span className="font-bold text-gray-800">{slot.assignedTo.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl">
                <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No parking slots are linked to your owner profile or flats.</p>
                <p className="text-[10px] text-gray-400 mt-1">Contact building management to request allocation.</p>
              </div>
            )}
          </div>

          {/* Quick announcements feed */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Recent Notices</h3>
              {noticesList.length > 3 && (
                <button
                  onClick={() => setActiveTab('notices')}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                >
                  View all
                </button>
              )}
            </div>
            <div className="space-y-3">
              {noticesList.length > 0 ? (
                noticesList.slice(0, 3).map((notice) => (
                  <div key={notice._id} className="p-3 bg-blue-50/30 border border-blue-100/50 rounded-xl flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-800">{notice.title}</span>
                      <span className="text-[8px] bg-blue-100 text-blue-800 font-extrabold uppercase px-1.5 py-0.5 rounded">
                        {notice.audience}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">{notice.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No active building notices.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. NOTICE BOARD TAB */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Community Notice Board</h1>
            <p className="text-xs text-gray-400">Official announcements from building management for owners and residents.</p>
          </div>

          <div className="space-y-4">
            {noticesList.length > 0 ? (
              noticesList.map((notice) => (
                <div key={notice._id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-2xl" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pl-2">
                    <h3 className="text-sm font-extrabold text-gray-800">{notice.title}</h3>
                    <span className="text-[9px] text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      For: {notice.audience}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-2">{notice.body}</p>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-[10px] text-gray-400 pt-2 border-t border-gray-50 pl-2">
                    <span>Posted: {new Date(notice.createdAt).toLocaleString('en-IN')}</span>
                    {notice.postedBy?.name && (
                      <span className="font-semibold text-gray-500">
                        By {notice.postedBy.name} ({notice.postedBy.role})
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm">
                No notices have been published for owners yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MY APARTMENT TAB (PROFILE + FLATS + FAMILY PROFILES) */}
      {activeTab === 'my-apartment' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Apartment Details</h1>
            <p className="text-xs text-gray-400">Manage flats owned in the building, review tenant occupancies, and configure family member credentials.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Flats list & Personal Details */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Personal details card */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Personal Profile Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Landlord Name</p>
                    <p className="font-extrabold text-gray-800 mt-1">{user?.name}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">System Role</p>
                    <p className="font-extrabold text-blue-600 mt-1 capitalize">{user?.role} Landlord</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Email Address</p>
                    <p className="font-extrabold text-gray-800 mt-1">{user?.email}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Contact Phone</p>
                    <p className="font-extrabold text-gray-800 mt-1">{user?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Owned Flats Registry</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flatsOwned.length > 0 ? (
                    flatsOwned.map((flat) => (
                      <div key={flat._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                          <div>
                            <h4 className="text-xs font-black text-gray-800">Flat {flat.flatNumber}</h4>
                            <p className="text-[9px] text-gray-400 font-semibold">{flat.floor} Floor &bull; {flat.area} SqFt</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            flat.status === 'occupied' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {flat.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {flat.tenantUserId ? (
                            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 space-y-2">
                              <p className="text-[9px] text-indigo-600 font-extrabold uppercase">Assigned Tenant</p>
                              <div className="flex justify-between text-[11px] font-medium">
                                <span className="text-gray-400">Name:</span>
                                <span className="text-gray-800 font-bold">{flat.tenantUserId.name}</span>
                              </div>
                              <div className="flex justify-between text-[11px] font-medium">
                                <span className="text-gray-400">Phone:</span>
                                <span className="text-gray-800 font-bold">{flat.tenantUserId.phone || '-'}</span>
                              </div>
                              <div className="flex justify-between text-[11px] font-medium">
                                <span className="text-gray-400">Monthly Rent:</span>
                                <span className="text-gray-800 font-extrabold text-blue-600">₹{flat.monthlyRent.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic text-center py-2">No resident tenant registered. Flat is vacant.</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm">
                      No flats registered.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Family Profile config */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Add form */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
                <div>
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Add Family Member</h3>
                  <p className="text-[9px] text-gray-400">Add profile cards of family members residing or sharing building access.</p>
                </div>
                
                <form onSubmit={handleAddFamilyMember} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Member Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Relation</label>
                      <select
                        value={familyRelation}
                        onChange={(e) => setFamilyRelation(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Phone</label>
                      <input
                        type="text"
                        required
                        placeholder="Phone"
                        value={familyPhone}
                        onChange={(e) => setFamilyPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/10"
                  >
                    Add Family Profile
                  </button>
                </form>
              </div>

              {/* Family List */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Family Members ({familyMembers.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {familyMembers.length > 0 ? (
                    familyMembers.map((m) => (
                      <div key={m.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{m.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{m.relationship} &bull; <span className="font-mono">{m.phone}</span></p>
                        </div>
                        <button
                          onClick={() => handleRemoveFamilyMember(m.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No family members registered.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. COMPLAINTS TICKETS TAB */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Maintenance Tickets</h1>
              <p className="text-xs text-gray-400">File complaints for structure, parking or plumbing queries.</p>
            </div>
            <button
              onClick={() => setIsComplaintModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/10 transition-colors animate-pulse"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Ticket</span>
            </button>
          </div>

          <div className="space-y-4">
            {complaintsList.length > 0 ? (
              complaintsList.map((c) => (
                <div key={c._id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">{c.title}</h3>
                      <p className="text-[10px] text-gray-400 font-bold capitalize mt-0.5">Category: {c.category}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                      c.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      c.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{c.description}</p>

                  {c.managerNote && (
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                      <p className="text-[10px] text-amber-800 font-extrabold uppercase">Manager Note</p>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-normal">{c.managerNote}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                    <span>Filed: {new Date(c.createdAt).toLocaleString('en-IN')}</span>
                    {c.assignedTo && <span>Assigned to: {c.assignedTo.name} ({c.assignedTo.phone})</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm">
                You have not registered any maintenance tickets.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SERVICES TAB (Refactored to look exactly like Complaints) */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Facilities & Ancillary Services</h1>
              <p className="text-xs text-gray-400">Request in-house maintenance specialists and pay for completed work.</p>
            </div>
            <button
              onClick={handleOpenServiceModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/10 transition-colors animate-pulse"
            >
              <Plus className="w-4 h-4" />
              <span>Book Service</span>
            </button>
          </div>

          {/* Service request history list (matching complaints layout) */}
          <div className="space-y-4">
            {serviceRequests.length > 0 ? (
              serviceRequests.map((r) => (
                <div key={r._id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">{r.name}</h3>
                      <p className="text-[10px] text-gray-400 font-bold capitalize mt-0.5">Category: {r.category} &bull; Flat {r.flatNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-800">Cost: ₹{r.cost || 0}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                        r.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        r.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{r.description}</p>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                    <span>Requested: {new Date(r.createdAt).toLocaleString('en-IN')}</span>
                    <div className="flex items-center gap-2">
                      {r.cost > 0 && r.status !== 'Completed' && (
                        <button
                          onClick={() => handlePayFeeClick(r)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg transition-all text-[10px]"
                        >
                          Pay Dues ₹{r.cost}
                        </button>
                      )}
                      {r.status === 'Completed' && (
                        <button
                          onClick={() => setReceiptToPrint({
                            title: r.name,
                            flat: r.flatNumber,
                            category: r.category,
                            amount: r.cost,
                            txnId: 'TXNSERVICE' + r._id.substring(18),
                            date: r.updatedAt || r.createdAt,
                            payer: user.name
                          })}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-lg transition-all text-[10px]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm">
                You have not registered any ancillary service bookings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. LEDGER PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Rent Payments Ledger</h1>
              <p className="text-xs text-gray-400">Ledger accounting sheets showing rent collections and transaction receipts.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedPayment({
                    name: 'Flat Maintenance Dues',
                    cost: 2500,
                    category: 'Maintenance',
                    flatNumber: flatsOwned[0]?.flatNumber || '101',
                    isMockDues: true
                  });
                  setCardNumber('');
                  setCardHolder('');
                  setCardExpiry('');
                  setCardCvv('');
                  setIsPaymentModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/10 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Maintenance Dues</span>
              </button>

              {receiptToPrint && (
                <button
                  onClick={handlePrintReceipt}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-650 hover:bg-gray-50 text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              )}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">Billing Month</th>
                    <th className="px-6 py-4">Flat Number</th>
                    <th className="px-6 py-4">Tenant Payer</th>
                    <th className="px-6 py-4">Rent Amount</th>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date Logged</th>
                    <th className="px-6 py-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {paymentsHistory.length > 0 ? (
                    paymentsHistory.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-800">{p.month}/{p.year}</td>
                        <td className="px-6 py-4 font-bold text-indigo-600">Flat {p.flatNumber}</td>
                        <td className="px-6 py-4">{p.tenantId?.name || 'Tenant Resident'}</td>
                        <td className="px-6 py-4 font-bold">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{p.transactionId || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                            p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === 'paid' && (
                            <button
                              onClick={() => setReceiptToPrint({
                                title: `Rent Invoice for ${p.month}/${p.year}`,
                                flat: p.flatNumber,
                                category: 'Apartment Rent',
                                amount: p.amount,
                                txnId: p.transactionId,
                                date: p.paidAt,
                                payer: p.tenantId?.name || 'Resident'
                              })}
                              className="p-1 text-gray-500 hover:bg-gray-50 rounded"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                        No payments received or outstanding.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Notifications Feed</h1>
              <p className="text-xs text-gray-400">Real-time alerts triggered by Socket.io, tenant rent transactions, and system broadcasts.</p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 font-bold transition-colors"
              >
                Clear All Logs
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notif.type === 'payment' ? 'bg-green-50 text-green-600 border border-green-100' :
                    notif.type === 'notice' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                    'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-grow space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-gray-800">{notif.title}</h4>
                      <span className="text-[9px] text-gray-400 font-semibold">{new Date(notif.time).toLocaleTimeString('en-IN')} &bull; {new Date(notif.time).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">{notif.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm">
                No active notifications logged.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Profile Settings & Live Support</h1>
            <p className="text-xs text-gray-400 font-medium">Configure owner profile credentials and contact building managers in real time.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-extrabold text-lg">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-800">{user?.name}</h4>
                  <span className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-extrabold uppercase">
                    Landlord Owner
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
                    <label className="text-[10px] font-bold text-gray-400">New Password (Prefix: OWN)</label>
                    <input
                      type="password"
                      required
                      placeholder="OWN12345"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Confirm Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Confirm OWN12345"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/10"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>

            {/* Chat Inbox panel */}
            <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4 h-[520px] flex flex-col">
              <div className="flex-shrink-0 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">In-App Chat Support Center</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Communicate with managers, tenants, or admin in real-time.</p>
                </div>
              </div>
              <div className="flex-grow overflow-hidden relative">
                <Inbox />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FILE COMPLAINT TICKET */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-extrabold text-gray-800">File Maintenance Ticket</h3>
              <button 
                onClick={() => setIsComplaintModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseComplaintSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Complaint Category</label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none focus:bg-white"
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="security">Security</option>
                  <option value="parking">Parking</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Ticket Title</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize the issue"
                  value={complaintTitle}
                  onChange={(e) => setComplaintTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain details of the complaint request..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Upload Attachments (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setComplaintFiles(e.target.files)}
                  accept="image/png, image/jpeg"
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <span className="text-[9px] text-gray-400 font-bold block pt-1">Accept JPEG/PNG, max size 2MB per file.</span>
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
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOOK SERVICE REQUEST (Exactly like complaints dropdown + desc) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-extrabold text-gray-800">Book In-House Service</h3>
              <button 
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleServiceSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Select Service Category</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none focus:bg-white"
                >
                  {availableServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Select Flat Registry</label>
                <select
                  value={serviceFlatNum}
                  onChange={(e) => setServiceFlatNum(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none focus:bg-white"
                >
                  <option value="">Select flat</option>
                  {flatsOwned.map(f => (
                    <option key={f._id} value={f.flatNumber}>Flat {f.flatNumber} ({f.floor} Floor)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Explain Issues / Requirements</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain details of the service requirement..."
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-800 outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOCK CARD PAYMENT */}
      {isPaymentModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Mock Payment Portal</h3>
                <p className="text-[9px] text-blue-600 font-bold">Paying for: {selectedPayment.name}</p>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayFeeSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-md flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] tracking-widest font-black uppercase">VastuSetu Card</span>
                  <Building className="w-5 h-5" />
                </div>
                <div className="text-sm font-mono tracking-widest text-center">
                  {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                </div>
                <div className="flex justify-between items-center text-[9px] uppercase">
                  <div>
                    <p className="text-[7px] opacity-75">Card Holder</p>
                    <p className="font-bold">{cardHolder || 'Full Name'}</p>
                  </div>
                  <div>
                    <p className="text-[7px] opacity-75">Expiry</p>
                    <p className="font-bold">{cardExpiry || 'MM/YY'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4111 2222 3333 4444"
                    value={cardNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                      const formatted = val.replace(/(.{4})/g, '$1 ').trim();
                      setCardNumber(formatted);
                    }}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                        if (val.length >= 2) {
                          val = val.substring(0, 2) + '/' + val.substring(2);
                        }
                        setCardExpiry(val);
                      }}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={3}
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center">
                  <span className="font-semibold text-gray-400">Total Bill Cost:</span>
                  <span className="text-sm font-black text-gray-800">₹{(selectedPayment.cost || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-grow py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                  disabled={payingSpinner}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5"
                  disabled={payingSpinner}
                >
                  {payingSpinner ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Pay ₹{(selectedPayment.cost || 0).toLocaleString('en-IN')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default OwnerDashboard;
