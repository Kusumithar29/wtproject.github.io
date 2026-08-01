import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  CreditCard, 
  Wrench, 
  Plus,
  Printer,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  ArrowRight,
  Shield,
  FileText,
  Settings,
  Briefcase,
  Car,
  Send,
  Info,
  Wallet
} from 'lucide-react';
import useToast from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import axiosInstance from '../../api/axiosInstance';
import DashboardLayout from '../../components/shared/DashboardLayout';
import NoticeChatPanel from '../../components/messaging/NoticeChatPanel';
import { validatePassword } from '../../utils/validators';
import { getOccupancyMode, OCCUPANCY_LABELS } from '../../utils/flatOccupancy';

const TenantDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const socket = useSocket();

  // Core Tenant States
  const [flatDetails, setFlatDetails] = useState(null);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [noticesList, setNoticesList] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Active Payment Forms
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);

  // Card details (Monthly Rent Payment)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Netbanking Payment States
  const [isNetbankingModalOpen, setIsNetbankingModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [netbankingUserId, setNetbankingUserId] = useState('');
  const [netbankingPassword, setNetbankingPassword] = useState('');
  const [submittingNetbanking, setSubmittingNetbanking] = useState(false);

  // Wallet Payment States
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletMobileNumber, setWalletMobileNumber] = useState('');
  const [walletOtp, setWalletOtp] = useState('');
  const [walletOtpSent, setWalletOtpSent] = useState(false);
  const [submittingWallet, setSubmittingWallet] = useState(false);

  // UPI Payment States
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiPaymentProcessing, setUpiPaymentProcessing] = useState(false);
  const [upiPaymentScanned, setUpiPaymentScanned] = useState(false);

  // Print Receipt State
  const [receiptToPrint, setReceiptToPrint] = useState(null);

  // Service Cost Payment Form
  const [isServicePaymentModalOpen, setIsServicePaymentModalOpen] = useState(false);
  const [selectedServicePayment, setSelectedServicePayment] = useState(null);
  const [serviceCardNumber, setServiceCardNumber] = useState('');
  const [serviceCardExpiry, setServiceCardExpiry] = useState('');
  const [serviceCardCvv, setServiceCardCvv] = useState('');
  const [serviceCardName, setServiceCardName] = useState('');
  const [submittingServicePayment, setSubmittingServicePayment] = useState(false);
  const [serviceReceiptToPrint, setServiceReceiptToPrint] = useState(null);

  // Raise Complaint UI states
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('plumbing');
  const [complaintFiles, setComplaintFiles] = useState([]);

  // Family profile lists
  const [familyName, setFamilyName] = useState('');
  const [familyRelation, setFamilyRelation] = useState('Spouse');
  const [familyPhone, setFamilyPhone] = useState('');

  // Request Service Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('plumbing');
  const [serviceDesc, setServiceDesc] = useState('');

  // Change Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch all tenant dashboard data
  const loadTenantData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Tenant's Flat Info
      const flatsRes = await axiosInstance.get('/flats');
      let flatObj = null;
      if (flatsRes.data.success && flatsRes.data.flats && flatsRes.data.flats.length > 0) {
        flatObj = flatsRes.data.flats[0];
        setFlatDetails(flatObj);
      }

      // 2. Fetch parking slots assigned to this tenant
      const parkingRes = await axiosInstance.get('/parking');
      if (parkingRes.data.success) {
        setParkingSlots(parkingRes.data.slots || []);
      } else {
        setParkingSlots([]);
      }

      // 3. Fetch Payments history
      const paymentsRes = await axiosInstance.get('/payments/history');
      if (paymentsRes.data.success) {
        setPaymentsHistory(paymentsRes.data.payments);
        const pending = paymentsRes.data.payments.find(p => p.status === 'pending' || p.status === 'overdue');
        setPendingPayment(pending || null);
      }

      // 4. Fetch Complaints raised by tenant
      const complaintsRes = await axiosInstance.get('/complaints');
      if (complaintsRes.data.success) {
        setComplaintsList(complaintsRes.data.complaints);
      }

      // 5. Fetch Notices broadcasted
      const noticesRes = await axiosInstance.get('/notices');
      if (noticesRes.data.success) {
        setNoticesList(noticesRes.data.notices);
      }

      // 6. Fetch Available Services & Service Requests
      const servicesAvailRes = await axiosInstance.get('/services/available');
      if (servicesAvailRes.data.success) {
        setAvailableServices(servicesAvailRes.data.services);
      }

      const servicesReqRes = await axiosInstance.get('/services/my-requests');
      if (servicesReqRes.data.success) {
        setServiceRequests(servicesReqRes.data.requests);
      }

    } catch (err) {
      console.error(err);
      showToast('Error loading tenant dashboard records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, []);

  // Setup Socket Listeners
  useEffect(() => {
    if (!socket || !user) return;

    const handlePaymentNotification = (payment) => {
      if (payment.tenantId === user._id || payment.tenantId?._id === user._id) {
        showToast(`Rent payment of ₹${payment.amount} processed successfully!`, 'success');
        loadTenantData();
      }
    };

    const handleServiceUpdate = (request) => {
      if (request.requestedBy === user._id || request.requestedBy?._id === user._id) {
        showToast(`Service Request '${request.name}' status updated to '${request.status}'!`, 'info');
        loadTenantData();
      }
    };

    const handleVisitorUpdate = (data) => {
      const { action, visitor } = data;
      if (visitor.flatNumber === user.flatNumber) {
        const text = action === 'check-in' 
          ? `Visitor '${visitor.name}' has checked in for your Flat ${visitor.flatNumber}.`
          : `Visitor '${visitor.name}' has checked out from your Flat ${visitor.flatNumber}.`;
        
        showToast(text, 'info');
      }
    };

    const handleNewNotice = (notice) => {
      if (notice.audience === 'all' || notice.audience === 'tenants') {
        showToast(`New Notice: ${notice.title}`, 'info');

        setNoticesList(prev => {
          const exists = prev.some(n => n._id === notice._id);
          if (exists) return prev;
          return [notice, ...prev];
        });
      }
    };

    socket.on('payment-notification', handlePaymentNotification);
    socket.on('service-request-update', handleServiceUpdate);
    socket.on('visitor-update', handleVisitorUpdate);
    socket.on('new-notice', handleNewNotice);

    return () => {
      socket.off('payment-notification', handlePaymentNotification);
      socket.off('service-request-update', handleServiceUpdate);
      socket.off('visitor-update', handleVisitorUpdate);
      socket.off('new-notice', handleNewNotice);
    };
  }, [socket, user]);

  // Load family profiles from local storage on user load
  useEffect(() => {
    if (user) {
      const storedFamily = localStorage.getItem(`family_${user._id}`);
      if (storedFamily) {
        setFamilyMembers(JSON.parse(storedFamily));
      }
    }
  }, [user]);

  // Format card number while typing
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Format expiry MM/YY
  const handleCardExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardExpiry(val);
  };

  // Format CVV (max 3 digits)
  const handleCardCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCardCvv(val);
  };

  // ─── PAYMENT HANDLERS ────────────────────────────────────────────────────────

  /**
   * UPI path — shows fake QR code for scanning
   * Called when user picks UPI from the payment method modal.
   */
  const handleConfirmPaymentViaUpi = async () => {
    if (!pendingPayment) {
      showToast('No pending rent record was found.', 'error');
      return;
    }

    setIsPaymentMethodModalOpen(false);
    setUpiPaymentScanned(false);
    setUpiPaymentProcessing(false);
    setIsUpiModalOpen(true);
  };

  // Simulate QR scan and payment completion
  const handleUpiPaymentCompleted = async () => {
    if (!pendingPayment) {
      showToast('No pending rent record was found.', 'error');
      return;
    }

    try {
      setUpiPaymentProcessing(true);

      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Initiate to get / create the payment record
      const initRes = await axiosInstance.post('/payments/initiate');
      if (!initRes.data.success) throw new Error('Failed to create payment order');

      const { payment } = initRes.data;

      // Simulate UPI processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Confirm directly — UPI mock payment
      const verifyRes = await axiosInstance.post('/payments/confirm', {
        paymentId: payment._id,
        paymentMethod: 'upi'
      });

      if (verifyRes.data.success) {
        showToast('Rent payment processed successfully via UPI!', 'success');
        setUpiPaymentScanned(true);
        
        // Auto-close after 2 seconds and show receipt
        setTimeout(() => {
          setIsUpiModalOpen(false);
          setReceiptToPrint(verifyRes.data.payment);
          setIsReceiptModalOpen(true);
          loadTenantData();
        }, 2000);
      } else {
        showToast(verifyRes.data.message || 'Payment verification failed.', 'error');
        setUpiPaymentProcessing(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment processing failed.', 'error');
      setUpiPaymentProcessing(false);
    }
  };

  /**
   * Card path — submits mock card form DIRECTLY to backend.
   * Does NOT open Razorpay checkout at all, so no "Add a new card" page appears.
   * The backend confirm endpoint falls into its mock/fallback branch when no
   * razorpayPaymentId / razorpaySignature fields are provided.
   */
  const handleConfirmPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!pendingPayment) {
      showToast('No pending rent record was found.', 'error');
      return;
    }

    try {
      setSubmittingPayment(true);

      // Initiate to get / create the payment record
      const initRes = await axiosInstance.post('/payments/initiate');
      if (!initRes.data.success) throw new Error('Failed to create payment order');

      const { payment } = initRes.data;

      // Confirm directly — no Razorpay fields sent so controller uses mock txn path
      const verifyRes = await axiosInstance.post('/payments/confirm', {
        paymentId: payment._id
        // razorpayPaymentId / razorpayOrderId / razorpaySignature intentionally omitted
      });

      if (verifyRes.data.success) {
        showToast('Rent payment processed successfully!', 'success');
        setIsPaymentModalOpen(false);
        setReceiptToPrint(verifyRes.data.payment);
        setIsReceiptModalOpen(true);
        loadTenantData();
      } else {
        showToast(verifyRes.data.message || 'Payment verification failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment processing failed.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // ─── NETBANKING PAYMENT HANDLER ─────────────────────────────────────────────

  const handleConfirmPaymentViaNetbanking = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!pendingPayment) {
      showToast('No pending rent record was found.', 'error');
      return;
    }

    if (!netbankingUserId.trim() || !netbankingPassword.trim()) {
      showToast('Please enter your bank login credentials.', 'error');
      return;
    }

    try {
      setSubmittingNetbanking(true);

      // Initiate to get / create the payment record
      const initRes = await axiosInstance.post('/payments/initiate');
      if (!initRes.data.success) throw new Error('Failed to create payment order');

      const { payment } = initRes.data;

      // Simulate netbanking processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Confirm directly — netbanking mock payment
      const verifyRes = await axiosInstance.post('/payments/confirm', {
        paymentId: payment._id,
        paymentMethod: 'netbanking',
        bankName: selectedBank
      });

      if (verifyRes.data.success) {
        showToast('Rent payment processed successfully via Netbanking!', 'success');
        setIsNetbankingModalOpen(false);
        setReceiptToPrint(verifyRes.data.payment);
        setIsReceiptModalOpen(true);
        loadTenantData();
      } else {
        showToast(verifyRes.data.message || 'Payment verification failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment processing failed.', 'error');
    } finally {
      setSubmittingNetbanking(false);
    }
  };

  // ─── WALLET PAYMENT HANDLER ────────────────────────────────────────────────

  const handleSendWalletOtp = async (e) => {
    e.preventDefault();
    if (!walletMobileNumber.trim() || walletMobileNumber.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    try {
      // Simulate OTP sending
      showToast('OTP sent to ' + walletMobileNumber, 'success');
      setWalletOtpSent(true);
      setWalletOtp('');
    } catch (err) {
      showToast('Failed to send OTP.', 'error');
    }
  };

  const handleConfirmPaymentViaWallet = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!pendingPayment) {
      showToast('No pending rent record was found.', 'error');
      return;
    }

    if (!walletOtp.trim() || walletOtp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP.', 'error');
      return;
    }

    try {
      setSubmittingWallet(true);

      // Initiate to get / create the payment record
      const initRes = await axiosInstance.post('/payments/initiate');
      if (!initRes.data.success) throw new Error('Failed to create payment order');

      const { payment } = initRes.data;

      // Simulate wallet processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Confirm directly — wallet mock payment
      const verifyRes = await axiosInstance.post('/payments/confirm', {
        paymentId: payment._id,
        paymentMethod: 'wallet',
        mobileNumber: walletMobileNumber
      });

      if (verifyRes.data.success) {
        showToast('Rent payment processed successfully via Wallet!', 'success');
        setIsWalletModalOpen(false);
        setReceiptToPrint(verifyRes.data.payment);
        setIsReceiptModalOpen(true);
        loadTenantData();
      } else {
        showToast(verifyRes.data.message || 'Payment verification failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment processing failed.', 'error');
    } finally {
      setSubmittingWallet(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  // Service Cost Card Number formatters
  const handleServiceCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(.{4})/g, '$1 ').trim();
    setServiceCardNumber(formatted);
  };

  const handleServiceCardExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setServiceCardExpiry(val);
  };

  const handleServiceCardCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setServiceCardCvv(val);
  };

  // Pay Service Cost Payment Submit Handler
  const handlePayServiceCostSubmit = (e) => {
    e.preventDefault();
    if (serviceCardNumber.replace(/\s/g, '').length !== 16 || serviceCardCvv.length !== 3) {
      showToast('Please fill out valid mock card details.', 'error');
      return;
    }

    setSubmittingServicePayment(true);
    setTimeout(async () => {
      try {
        setSubmittingServicePayment(false);
        setIsServicePaymentModalOpen(false);

        const res = await axiosInstance.put(`/services/requests/${selectedServicePayment._id}`, {
          status: 'Completed'
        });

        if (res.data.success) {
          showToast('Mock service fee payment verified! Receipt generated.', 'success');
          
          const randomTxnId = 'TXN' + Math.random().toString(36).substring(2, 9).toUpperCase();
          const mockReceipt = {
            title: selectedServicePayment.name,
            flat: user.flatNumber,
            category: selectedServicePayment.category,
            amount: selectedServicePayment.cost,
            txnId: randomTxnId,
            date: new Date(),
            payer: user.name
          };

          setServiceReceiptToPrint(mockReceipt);
          loadTenantData();
        }
      } catch (err) {
        showToast('Failed to clear service ticket payment.', 'error');
      }
    }, 1550);
  };

  // Raise complaint form submit
  const handleRaiseComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDesc.trim()) {
      showToast('Title and Description are required to file a ticket.', 'error');
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
        showToast('Complaint ticket raised successfully.', 'success');
        setIsComplaintModalOpen(false);
        setComplaintTitle('');
        setComplaintDesc('');
        setComplaintFiles([]);
        loadTenantData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to file complaint.', 'error');
    }
  };

  // Open Service Modal
  const handleOpenServiceModal = () => {
    setServiceDesc('');
    setIsServiceModalOpen(true);
  };

  // Raise Service Request
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceDesc.trim()) {
      showToast('Please describe the service required.', 'error');
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
        showToast('Service ticket filed successfully! Manager will allocate staff.', 'success');
        setIsServiceModalOpen(false);
        loadTenantData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request service.', 'error');
    }
  };

  // CRUD Family profiles
  const handleAddFamilyMember = (e) => {
    e.preventDefault();
    if (!familyName.trim() || !familyPhone.trim()) {
      showToast('Name and phone are required.', 'error');
      return;
    }

    const newMember = {
      id: Date.now().toString(),
      name: familyName,
      relationship: familyRelation,
      phone: familyPhone
    };

    const updated = [...familyMembers, newMember];
    setFamilyMembers(updated);
    localStorage.setItem(`family_${user._id}`, JSON.stringify(updated));

    setFamilyName('');
    setFamilyPhone('');
    showToast('Family profile added successfully!', 'success');
  };

  const handleRemoveFamilyMember = (id) => {
    const updated = familyMembers.filter(m => m.id !== id);
    setFamilyMembers(updated);
    localStorage.setItem(`family_${user._id}`, JSON.stringify(updated));
    showToast('Family profile removed.', 'info');
  };

  // Change password credentials
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

    const check = validatePassword(newPassword, 'tenant');
    if (!check.isValid) {
      showToast(check.message, 'error');
      return;
    }

    try {
      showToast('Password updated successfully! (Role Prefix TEN Enforced)', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast('Failed to update credentials.', 'error');
    }
  };

  // Initiate monthly rent billing check
  const handleInitiateRent = async () => {
    try {
      const res = await axiosInstance.post('/payments/initiate');
      if (res.data.success) {
        showToast('Rent billing initiated for the current month!', 'success');
        loadTenantData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Rent billing is already active.', 'info');
    }
  };

  const handlePrintReceipt = () => {
  console.log('Print button clicked'); // DEBUG
  try {
    window.print();
  } catch (err) {
    console.error('Print failed:', err);
    showToast('Print dialog failed to open', 'error');
  }
};

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Building },
    { id: 'my-apartment', label: 'My Apartment', icon: Users },
    { id: 'notices', label: 'Notice Board', icon: FileText },
    { id: 'complaints', label: 'Complaints', icon: Wrench },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading Tenant Portal...</p>
        </div>
      </div>
    );
  }

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

      {/* SERVICE MOCK PRINTABLE RECEIPT CARD INJECTION */}
      {serviceReceiptToPrint && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black text-xs font-mono leading-loose">
          <div className="print-receipt-container border-2 border-black p-8 rounded-xl max-w-md mx-auto space-y-4">
            <h2 className="text-center text-lg font-black tracking-widest border-b-2 border-black pb-2 uppercase">VastuSetu Service Receipt</h2>
            <div className="space-y-1">
              <p>Payer Name: <span className="font-bold">{serviceReceiptToPrint.payer}</span></p>
              <p>Apartment Flat: <span className="font-bold">Flat {serviceReceiptToPrint.flat}</span></p>
              <p>Service Category: <span className="font-bold">{serviceReceiptToPrint.category}</span></p>
              <p>Service Name: <span className="font-bold">{serviceReceiptToPrint.title}</span></p>
              <p>Transaction ID: <span className="font-bold">{serviceReceiptToPrint.txnId}</span></p>
              <p>Dues Paid: <span className="font-bold">₹{serviceReceiptToPrint.amount.toLocaleString('en-IN')}</span></p>
              <p>Paid Date: <span className="font-bold">{new Date(serviceReceiptToPrint.date).toLocaleString('en-IN')}</span></p>
            </div>
            <div className="text-center text-[9px] pt-4 border-t-2 border-black border-dashed">
              Verified Sandbox Transaction Receipt &bull; Single Flat Registry VastuSetu
            </div>
            <button 
              onClick={() => setServiceReceiptToPrint(null)} 
              className="no-print w-full mt-4 py-2 bg-teal-600 text-white rounded text-[10px] font-bold"
            >
              Back to Portal
            </button>
          </div>
        </div>
      )}

      {/* 1. DASHBOARD OVERVIEW TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Tenant Dashboard</h1>
              <p className="text-xs text-gray-400 font-medium">Welcome back, {user?.name}! You are a tenant renting on a temporary lease — pay rent to your flat owner and manage requests here.</p>
            </div>
            
            <button
              onClick={handleInitiateRent}
              className="px-4 py-2 border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100/70 text-xs font-semibold rounded-xl transition-all"
            >
              Check/Initiate Rent Billing
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Rent Status Card */}
            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                pendingPayment 
                  ? 'bg-amber-50 border-amber-100 text-amber-500' 
                  : 'bg-green-50 border-green-100 text-green-500'
              }`}>
                {pendingPayment ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rent Invoice Status</p>
                <h3 className="text-md font-extrabold text-gray-800 mt-0.5">
                  {pendingPayment ? (
                    <span className="text-amber-600 font-bold">Pending Rent</span>
                  ) : (
                    <span className="text-green-600 font-bold">Paid</span>
                  )}
                </h3>
              </div>
            </div>

            {/* Flat Details Card */}
            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-500">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">My Apartment Flat</p>
                <h3 className="text-lg font-extrabold text-gray-800">
                  {flatDetails ? `Flat ${flatDetails.flatNumber}` : 'Not Assigned'}
                </h3>
              </div>
            </div>

            {/* Active Tickets Card */}
            <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-500">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Complaints</p>
                <h3 className="text-lg font-extrabold text-gray-800">
                  {complaintsList.filter(c => c.status !== 'resolved').length}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rent Payment Action Block */}
            <div className="lg:col-span-2 bg-gradient-to-br from-teal-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[220px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none"></div>
              
              <div className="space-y-2 relative z-10">
                <span className="text-[10px] bg-teal-600/60 border border-teal-500 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Monthly Rent Settlement
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {pendingPayment ? 'Monthly Rent Payment is Pending' : 'Your Rent is Fully Settled!'}
                </h2>
                <p className="text-xs text-teal-100 max-w-sm">
                  {pendingPayment 
                    ? `Payment invoice of ₹${pendingPayment.amount.toLocaleString('en-IN')} for Billing Month ${pendingPayment.month}/${pendingPayment.year} is outstanding.`
                    : 'All rent payments are up to date. Thank you for making timely settlements!'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-white/10 relative z-10">
                <div className="text-left">
                  <p className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">Total Monthly Rent</p>
                  <p className="text-lg font-black">₹{flatDetails ? flatDetails.monthlyRent.toLocaleString('en-IN') : '15,000'}</p>
                </div>

                {pendingPayment ? (
                  <button
                    onClick={() => setIsPaymentMethodModalOpen(true)}
                    className="px-6 py-3 bg-white text-teal-800 font-bold text-xs rounded-xl shadow-lg hover:shadow-xl hover:bg-teal-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Pay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600/40 rounded-xl text-xs font-bold border border-teal-500/20">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>No Action Needed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Resident Flat & Landlord Info Profile */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-50 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-500" />
                  <span>Rental Agreement Info</span>
                </h3>
                
                {flatDetails ? (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-semibold">Apartment Flat</span>
                      <span className="text-gray-800 font-bold">Flat {flatDetails.flatNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-semibold">Floor level</span>
                      <span className="text-gray-800 font-bold">Floor {flatDetails.floor}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-semibold">Plinth Area</span>
                      <span className="text-gray-800 font-bold">{flatDetails.area} Sq Ft</span>
                    </div>
                    <div className="h-px bg-gray-50 my-2" />
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400 font-semibold pt-0.5">Flat Owner</span>
                      <div className="text-right">
                        <p className="text-gray-800 font-bold">{flatDetails.ownerUserId?.name || 'Owner'}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{flatDetails.ownerUserId?.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 italic">
                    Flat assignment details are not found. Contact building administrator.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parking allocation details */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">My Parking Allocation</h3>
                <p className="text-[10px] text-gray-400">Slots linked to your flat ({user?.flatNumber || 'N/A'}) or resident profile.</p>
              </div>
            </div>
            {parkingSlots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {parkingSlots.map((slot) => (
                  <div
                    key={slot._id || slot.slotNumber}
                    className="p-4 bg-teal-50/30 border border-teal-100 rounded-xl space-y-3"
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
                        <span className="font-bold text-teal-700">Flat {slot.flatNumber || user?.flatNumber || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold">Registered To</span>
                        <span className="font-bold text-gray-800">{slot.assignedTo?.name || user?.name}</span>
                      </div>
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
                <p className="text-xs text-gray-400 font-medium">No parking slot is assigned to your account yet.</p>
                <p className="text-[10px] text-gray-400 mt-1">Contact building management to request allocation.</p>
              </div>
            )}
          </div>

          {/* Recent building notices */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Recent Notices</h3>
              {noticesList.length > 3 && (
                <button
                  onClick={() => setActiveTab('notices')}
                  className="text-[10px] font-bold text-teal-600 hover:text-teal-700"
                >
                  View all
                </button>
              )}
            </div>
            <div className="space-y-3">
              {noticesList.length > 0 ? (
                noticesList.slice(0, 3).map((notice) => (
                  <div key={notice._id} className="p-3 bg-teal-50/30 border border-teal-100/50 rounded-xl flex flex-col gap-1.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-gray-800">{notice.title}</span>
                      <span className="text-[8px] bg-teal-100 text-teal-800 font-extrabold uppercase px-1.5 py-0.5 rounded flex-shrink-0">
                        {notice.audience}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">{notice.body}</p>
                    <p className="text-[9px] text-gray-400">
                      {new Date(notice.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-4">No building announcements at this time.</p>
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
            <p className="text-xs text-gray-400">Official announcements and in-app chat with building management and neighbors.</p>
          </div>

          <div className="space-y-4">
            {noticesList.length > 0 ? (
              noticesList.map((notice) => (
                <div key={notice._id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-l-2xl" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pl-2">
                    <h3 className="text-sm font-extrabold text-gray-800">{notice.title}</h3>
                    <span className="text-[9px] text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      For: {notice.audience}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-2">{notice.body}</p>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-[10px] text-gray-400 pt-2 border-t border-gray-50 pl-2">
                    <span>
                      Posted: {new Date(notice.createdAt).toLocaleString('en-IN')}
                    </span>
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
                No notices have been published for tenants yet.
              </div>
            )}
          </div>

          <NoticeChatPanel
            accent="teal"
            description="Communicate with managers, landlords, or administration in real-time."
          />
        </div>
      )}

      {/* 3. MY APARTMENT TAB */}
      {activeTab === 'my-apartment' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Rental & Family Profiles</h1>
            <p className="text-xs text-gray-400">View your leased flat, landlord (owner) details, and family profiles for this residency.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              
              {/* Personal Details Card */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Personal Profile Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Resident Name</p>
                    <p className="font-extrabold text-gray-800 mt-1">{user?.name}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">System Role</p>
                    <p className="font-extrabold text-teal-600 mt-1 capitalize">{user?.role} Resident</p>
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

              {/* Flat Detail Summary Card */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Rental Lease Details</h3>
                {flatDetails ? (
                  <div className="space-y-3.5 text-xs text-gray-600">
                    <p className="text-[10px] text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 font-semibold">
                      Occupancy: {OCCUPANCY_LABELS[getOccupancyMode(flatDetails)] || getOccupancyMode(flatDetails)}
                    </p>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="font-medium text-gray-400">Rented Flat</span>
                      <span className="font-extrabold text-teal-600">Flat {flatDetails.flatNumber}</span>
                    </div>
                    {flatDetails.leaseStart && (
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="font-medium text-gray-400">Lease start</span>
                        <span className="font-bold text-gray-800">{new Date(flatDetails.leaseStart).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                    {flatDetails.leaseEnd && (
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="font-medium text-gray-400">Lease end</span>
                        <span className="font-bold text-gray-800">{new Date(flatDetails.leaseEnd).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="font-medium text-gray-400">Floor level</span>
                      <span className="font-bold text-gray-800">{flatDetails.floor} Floor</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="font-medium text-gray-400">Monthly Rent Dues</span>
                      <span className="font-black text-gray-800">₹{flatDetails.monthlyRent.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="font-medium text-gray-400">Total Plinth Area</span>
                      <span className="font-bold text-gray-800">{flatDetails.area} Sq Ft</span>
                    </div>
                    
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Flat owner (your landlord)</span>
                      <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl mt-2 text-xs">
                        <p className="font-black text-gray-800">{flatDetails.ownerUserId?.name || 'Landlord'}</p>
                        <p className="text-gray-500 mt-1">Email: {flatDetails.ownerUserId?.email || '-'}</p>
                        <p className="text-gray-500">Phone: {flatDetails.ownerUserId?.phone || '-'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center">No flat record associated with this tenant account.</p>
                )}
              </div>

            </div>

            <div className="lg:col-span-5 space-y-6">
              {/* Add Family Member Profile Form */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Add Family Member</h3>
                
                <form onSubmit={handleAddFamilyMember} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aditi Sharma"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-teal-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Relationship</label>
                    <select
                      value={familyRelation}
                      onChange={(e) => setFamilyRelation(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Contact Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={familyPhone}
                      onChange={(e) => setFamilyPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-teal-300 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/10 transition-colors"
                  >
                    Register Profile
                  </button>
                </form>
              </div>

              {/* Family Members List Grid */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Registered Family Profiles ({familyMembers.length})</h3>
                
                {familyMembers.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="p-3 bg-teal-50/20 border border-teal-100/50 rounded-xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-gray-800">{member.name}</h4>
                          <p className="text-[9px] text-gray-400 font-semibold">{member.relationship} &bull; <span className="font-mono">{member.phone}</span></p>
                        </div>
                        <button
                          onClick={() => handleRemoveFamilyMember(member.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 italic text-xs">
                    No family members are currently registered.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Support Tickets</h1>
              <p className="text-xs text-gray-400">File structure, parking or utility complaints directly to managers.</p>
            </div>
            <button
              onClick={() => setIsComplaintModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-600/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>File New Ticket</span>
            </button>
          </div>

          <div className="space-y-4">
            {complaintsList.length > 0 ? (
              complaintsList.map((c) => (
                <div key={c._id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">{c.title}</h3>
                      <span className="text-[10px] text-gray-400 font-bold capitalize mt-0.5 block">Category: {c.category}</span>
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

                  {c.attachments && c.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {c.attachments.map((url, index) => (
                        <a 
                          key={index} 
                          href={url.startsWith('/') ? `http://localhost:5000${url}` : url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-16 h-16 rounded-xl border border-gray-100 overflow-hidden hover:opacity-85 transition-opacity"
                        >
                          <img 
                            src={url.startsWith('/') ? `http://localhost:5000${url}` : url} 
                            alt="Attachment" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = url; }}
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {c.managerNote && (
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                      <p className="text-[10px] text-amber-800 font-extrabold uppercase">Manager Update Note</p>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-normal">{c.managerNote}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-gray-400 pt-2.5 border-t border-gray-50">
                    <span>Filed On: {new Date(c.createdAt).toLocaleString('en-IN')}</span>
                    {c.assignedTo ? (
                      <span className="font-semibold text-gray-500">
                        Assigned Manager: {c.assignedTo.name} ({c.assignedTo.phone || 'Staff'})
                      </span>
                    ) : (
                      <span className="italic text-gray-400">Awaiting Manager Assignment</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm">
                No active complaints registered under your residency profile.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Facilities & Ancillary Services</h1>
              <p className="text-xs text-gray-400">Book in-house building specialists and track dispatch state history.</p>
            </div>
            <button
              onClick={handleOpenServiceModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-600/10 transition-colors animate-pulse"
            >
              <Plus className="w-4 h-4" />
              <span>Book Service</span>
            </button>
          </div>

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
                          onClick={() => {
                            setSelectedServicePayment(r);
                            setServiceCardNumber('');
                            setServiceCardExpiry('');
                            setServiceCardCvv('');
                            setServiceCardName('');
                            setIsServicePaymentModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-lg transition-all text-[10px]"
                        >
                          Pay Dues ₹{r.cost}
                        </button>
                      )}
                      {r.status === 'Completed' && (
                        <button
                          onClick={() => {
                            const randomTxnId = 'TXN' + Math.random().toString(36).substring(2, 9).toUpperCase();
                            setServiceReceiptToPrint({
                              title: r.name,
                              flat: user.flatNumber,
                              category: r.category,
                              amount: r.cost,
                              txnId: randomTxnId,
                              date: r.updatedAt || r.createdAt,
                              payer: user.name
                            });
                          }}
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
                No ancillary services requested yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Rent Ledger</h1>
              <p className="text-xs text-gray-400">Statement statement ledger history showing your rent invoices paid and outstanding.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (pendingPayment) {
                    setIsPaymentMethodModalOpen(true);
                  } else {
                    const currentMonth = new Date().getMonth() + 1;
                    const currentYear = new Date().getFullYear();
                    setPendingPayment({
                      _id: 'mock_pending_' + Date.now(),
                      amount: flatDetails ? flatDetails.monthlyRent : 15000,
                      month: currentMonth,
                      year: currentYear,
                      flatNumber: flatDetails ? flatDetails.flatNumber : '101',
                      status: 'pending'
                    });
                    setIsPaymentMethodModalOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-600/10 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Rent Dues</span>
              </button>

              {(selectedReceipt || receiptToPrint) && (
                <button
                  onClick={handlePrintReceipt}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-650 hover:bg-gray-50 text-xs font-bold rounded-xl shadow-sm transition-colors animate-fade-in"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">Billing Month</th>
                    <th className="px-6 py-4">Flat Number</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Payment Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {paymentsHistory.length > 0 ? (
                    paymentsHistory.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-800">{p.month}/{p.year}</td>
                        <td className="px-6 py-4 font-bold text-teal-600">Flat {p.flatNumber}</td>
                        <td className="px-6 py-4 font-bold">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{p.transactionId || '-'}</td>
                        <td className="px-6 py-4 text-gray-400">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                            p.status === 'paid' ? 'bg-green-100 text-green-800' :
                            p.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {p.status === 'paid' ? (
                            <button
                              onClick={() => {
                                setSelectedReceipt(p);
                                setIsReceiptModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-teal-50 text-teal-600 hover:text-teal-700 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          ) : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No rent payments are recorded under this account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Profile Settings</h1>
            <p className="text-xs text-gray-400 font-medium">Configure resident credentials and password.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
            <div className="space-y-6">
              
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-600 font-extrabold text-lg">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-800">{user?.name}</h4>
                  <span className="text-[9px] bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-extrabold uppercase">
                    Tenant Resident
                  </span>
                </div>
                <div className="w-full pt-2 text-left text-xs space-y-2 border-t border-gray-50">
                  <p className="text-gray-500 font-medium">Email: <span className="text-gray-800 font-bold">{user?.email}</span></p>
                  <p className="text-gray-500 font-medium">Phone: <span className="text-gray-800 font-bold">{user?.phone || '-'}</span></p>
                  <p className="text-gray-500 font-medium">Flat Number: <span className="text-gray-800 font-bold">Flat {user?.flatNumber || '-'}</span></p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Update Credentials</h3>
                <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">New Password (Prefix: TEN)</label>
                    <input
                      type="password"
                      required
                      placeholder="TEN12345"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-teal-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Confirm Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Confirm TEN12345"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-teal-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-md shadow-teal-600/10"
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
      {/* MODAL: SELECT PAYMENT METHOD (UPI / CARD / NETBANKING / WALLET) */}
      {isPaymentMethodModalOpen && pendingPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Select Payment Method</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Choose your preferred payment option</p>
              </div>
              <button 
                onClick={() => {
                  setIsPaymentMethodModalOpen(false);
                  setSelectedPaymentMethod(null);
                }}
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              
              {/* UPI Option — shows fake QR code */}
              <button
                onClick={() => {
                  setSelectedPaymentMethod('upi');
                  setIsPaymentMethodModalOpen(false);
                  setTimeout(() => handleConfirmPaymentViaUpi(), 100);
                }}
                className="w-full p-4 border-2 border-gray-100 hover:border-purple-400 rounded-2xl transition-all hover:bg-purple-50 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-100 transition-all">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-xs font-bold text-gray-800">UPI Payment</h4>
                    <p className="text-[10px] text-gray-500 mt-1">Pay instantly using UPI ID</p>
                  </div>
                  <div className="text-2xl text-purple-600 group-hover:scale-110 transition-transform">→</div>
                </div>
              </button>

              {/* Card Option */}
              <button
                onClick={() => {
                  setSelectedPaymentMethod('card');
                  setIsPaymentMethodModalOpen(false);
                  setCardNumber('');
                  setCardExpiry('');
                  setCardCvv('');
                  setCardName('');
                  setTimeout(() => setIsPaymentModalOpen(true), 100);
                }}
                className="w-full p-4 border-2 border-gray-100 hover:border-teal-400 rounded-2xl transition-all hover:bg-teal-50 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl flex items-center justify-center group-hover:from-teal-200 group-hover:to-teal-100 transition-all">
                    <CreditCard className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-xs font-bold text-gray-800">Debit / Credit Card</h4>
                    <p className="text-[10px] text-gray-500 mt-1">Pay using your card details</p>
                  </div>
                  <div className="text-2xl text-teal-600 group-hover:scale-110 transition-transform">→</div>
                </div>
              </button>

              {/* Netbanking Option */}
              <button
                onClick={() => {
                  setSelectedPaymentMethod('netbanking');
                  setIsPaymentMethodModalOpen(false);
                  setSelectedBank('HDFC');
                  setNetbankingUserId('');
                  setNetbankingPassword('');
                  setTimeout(() => setIsNetbankingModalOpen(true), 100);
                }}
                className="w-full p-4 border-2 border-gray-100 hover:border-blue-400 rounded-2xl transition-all hover:bg-blue-50 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-100 transition-all">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-xs font-bold text-gray-800">Net Banking</h4>
                    <p className="text-[10px] text-gray-500 mt-1">Pay via your bank account</p>
                  </div>
                  <div className="text-2xl text-blue-600 group-hover:scale-110 transition-transform">→</div>
                </div>
              </button>

              {/* Wallet Option */}
              <button
                onClick={() => {
                  setSelectedPaymentMethod('wallet');
                  setIsPaymentMethodModalOpen(false);
                  setWalletMobileNumber('');
                  setWalletOtp('');
                  setWalletOtpSent(false);
                  setTimeout(() => setIsWalletModalOpen(true), 100);
                }}
                className="w-full p-4 border-2 border-gray-100 hover:border-orange-400 rounded-2xl transition-all hover:bg-orange-50 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-100 transition-all">
                    <Wallet className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-xs font-bold text-gray-800">Digital Wallet</h4>
                    <p className="text-[10px] text-gray-500 mt-1">Pay using wallet balance</p>
                  </div>
                  <div className="text-2xl text-orange-600 group-hover:scale-110 transition-transform">→</div>
                </div>
              </button>

            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-50 text-[10px] text-gray-500 text-center">
              Rent Amount: <span className="font-bold text-gray-800">₹{pendingPayment.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: UPI PAYMENT WITH FAKE QR CODE */}
      {isUpiModalOpen && pendingPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">UPI Payment Gateway</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Scan QR Code to Pay Rent</p>
              </div>
              <button 
                onClick={() => setIsUpiModalOpen(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex flex-col items-center">
              
              {!upiPaymentScanned ? (
                <>
                  <div>
                    <p className="text-xs text-gray-500 text-center mb-4 font-semibold">Billing Month: {pendingPayment.month}/{pendingPayment.year} • Flat {pendingPayment.flatNumber}</p>
                  </div>

                  {/* Fake QR Code */}
                  <div className="p-6 bg-white border-2 border-purple-200 rounded-2xl shadow-lg">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-64 h-64"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* QR Pattern */}
                      <rect width="200" height="200" fill="white"/>
                      
                      {/* Top-left position marker */}
                      <rect x="10" y="10" width="40" height="40" fill="black"/>
                      <rect x="15" y="15" width="30" height="30" fill="white"/>
                      <rect x="20" y="20" width="20" height="20" fill="black"/>
                      
                      {/* Top-right position marker */}
                      <rect x="150" y="10" width="40" height="40" fill="black"/>
                      <rect x="155" y="15" width="30" height="30" fill="white"/>
                      <rect x="160" y="20" width="20" height="20" fill="black"/>
                      
                      {/* Bottom-left position marker */}
                      <rect x="10" y="150" width="40" height="40" fill="black"/>
                      <rect x="15" y="155" width="30" height="30" fill="white"/>
                      <rect x="20" y="160" width="20" height="20" fill="black"/>
                      
                      {/* Timing patterns */}
                      <line x1="50" y1="30" x2="140" y2="30" stroke="black" strokeWidth="2"/>
                      <line x1="30" y1="50" x2="30" y2="140" stroke="black" strokeWidth="2"/>
                      <line x1="170" y1="50" x2="170" y2="140" stroke="black" strokeWidth="2"/>
                      <line x1="50" y1="170" x2="140" y2="170" stroke="black" strokeWidth="2"/>
                      
                      {/* Random data pattern */}
                      <rect x="60" y="60" width="80" height="80" fill="none" stroke="black" strokeWidth="1"/>
                      <circle cx="100" cy="100" r="30" fill="none" stroke="black" strokeWidth="1"/>
                      
                      {/* Scattered dots for QR effect */}
                      {[...Array(100)].map((_, i) => {
                        const x = 60 + Math.random() * 80;
                        const y = 60 + Math.random() * 80;
                        return <rect key={i} x={x} y={y} width="2" height="2" fill={Math.random() > 0.5 ? 'black' : 'white'}/>;
                      })}
                      
                      {/* UPI Logo text in center */}
                      <text x="100" y="105" fontSize="8" fill="black" textAnchor="middle" fontWeight="bold">UPI</text>
                      <text x="100" y="115" fontSize="6" fill="black" textAnchor="middle">VASTUSETS</text>
                    </svg>
                  </div>

                  <div className="text-center space-y-2 w-full">
                    <p className="text-xs text-gray-600 font-medium">Point your phone camera at the QR to pay</p>
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                      <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Amount to Pay</p>
                      <p className="text-2xl font-black text-purple-600 mt-1">₹{pendingPayment.amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => setIsUpiModalOpen(false)}
                      className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpiPaymentCompleted}
                      disabled={upiPaymentProcessing}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {upiPaymentProcessing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <span>Payment Done</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl flex items-start gap-2 text-[10px] text-purple-800 w-full">
                    <Shield className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="leading-normal">
                      <strong>Sandbox Mode:</strong> This is a fake QR code for testing. Click "Payment Done" to simulate scanning and complete the transaction.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Payment Success Screen */}
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-16 h-16 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-extrabold text-gray-800">Payment Successful!</h3>
                      <p className="text-xs text-gray-500">Amount Paid: <span className="font-bold text-gray-800">₹{pendingPayment.amount.toLocaleString('en-IN')}</span></p>
                      <p className="text-[10px] text-gray-400 mt-2">Redirecting to receipt...</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {isPaymentModalOpen && pendingPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-100 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Secure Rent Payment Portal</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Billing Month: {pendingPayment.month}/{pendingPayment.year} &bull; Flat {pendingPayment.flatNumber}</p>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-5 overflow-y-auto">
              
              {/* Premium Credit Card Mockup Render */}
              <div className="w-full h-44 bg-gradient-to-br from-teal-600 to-slate-800 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 -translate-y-8"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[8px] text-teal-200 font-bold uppercase tracking-widest">Resident Rent Card</p>
                    <h4 className="text-xs font-extrabold tracking-wider mt-0.5">VastuSetu Residency</h4>
                  </div>
                  <span className="text-xs font-mono font-bold tracking-tight bg-teal-500/20 px-2 py-0.5 rounded border border-teal-400/25">MOCK PORTAL</span>
                </div>

                <div className="py-2">
                  <p className="font-mono text-sm tracking-[0.25em] text-center text-teal-50">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </p>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[7px] text-teal-200 font-semibold uppercase tracking-wider">Cardholder</p>
                    <p className="text-xs font-bold uppercase tracking-wider truncate max-w-[180px]">{cardName || 'MEMBER NAME'}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[7px] text-teal-200 font-semibold uppercase tracking-wider">Expires</p>
                      <p className="text-[10px] font-mono font-bold">{cardExpiry || 'MM/YY'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-teal-200 font-semibold uppercase tracking-wider">CVV</p>
                      <p className="text-[10px] font-mono font-bold">***</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Inputs */}
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="As printed on card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-teal-300 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4321 0987 6543 2109"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-teal-300 transition-colors font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleCardExpiryChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-teal-300 transition-colors font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">CVV</label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      value={cardCvv}
                      onChange={handleCardCvvChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-teal-300 transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Secure Info Alert */}
              <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl flex items-start gap-2 text-[10px] text-teal-800">
                <Shield className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <p className="leading-normal">
                  <strong>Sandbox Payment Processing:</strong> Card credentials inputted are simulated locally. No actual cash transfers are transacted. Do NOT enter genuine credit card details.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/10 disabled:opacity-50"
                >
                  {submittingPayment ? 'Processing...' : `Pay Rent ₹${pendingPayment.amount.toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PAY RENT VIA NETBANKING */}
      {isNetbankingModalOpen && pendingPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-100 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Net Banking Payment Portal</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Billing Month: {pendingPayment.month}/{pendingPayment.year} &bull; Flat {pendingPayment.flatNumber}</p>
              </div>
              <button 
                onClick={() => setIsNetbankingModalOpen(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPaymentViaNetbanking} className="p-6 space-y-5 overflow-y-auto">
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  <h4 className="text-xs font-bold text-blue-800">Select Your Bank</h4>
                </div>
                
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-xs text-gray-800 outline-none focus:border-blue-400"
                >
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="AXIS">Axis Bank</option>
                  <option value="SBI">State Bank of India (SBI)</option>
                  <option value="KOTAK">Kotak Mahindra Bank</option>
                  <option value="INDUSIND">IndusInd Bank</option>
                </select>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Net Banking User ID / Username</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your bank login ID"
                    value={netbankingUserId}
                    onChange={(e) => setNetbankingUserId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-blue-300 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Net Banking Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your bank password"
                    value={netbankingPassword}
                    onChange={(e) => setNetbankingPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-blue-300 transition-colors"
                  />
                </div>
              </div>

              {/* Secure Info Alert */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-2 text-[10px] text-blue-800">
                <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="leading-normal">
                  <strong>Sandbox Environment:</strong> Net banking credentials inputted are simulated locally. No actual bank login occurs. Do NOT enter genuine bank credentials.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNetbankingModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNetbanking}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 disabled:opacity-50"
                >
                  {submittingNetbanking ? 'Processing...' : `Pay Rent ₹${pendingPayment.amount.toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PAY RENT VIA WALLET */}
      {isWalletModalOpen && pendingPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-100 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Digital Wallet Payment</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Billing Month: {pendingPayment.month}/{pendingPayment.year} &bull; Flat {pendingPayment.flatNumber}</p>
              </div>
              <button 
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              
              {!walletOtpSent ? (
                <form onSubmit={handleSendWalletOtp} className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                    <h4 className="text-xs font-bold text-orange-800 mb-3">Enter Mobile Number</h4>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={walletMobileNumber}
                      onChange={(e) => setWalletMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10))}
                      maxLength="10"
                      className="w-full px-4 py-2.5 bg-white border border-orange-200 rounded-xl text-xs text-gray-800 outline-none focus:border-orange-400 font-mono"
                    />
                    <p className="text-[9px] text-orange-600 mt-2 font-semibold">OTP will be sent to this number for verification</p>
                  </div>

                  <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-2xl flex items-start gap-2 text-[10px] text-orange-800">
                    <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <p className="leading-normal">
                      <strong>Sandbox Wallet:</strong> Mock wallet system for testing. No actual funds will be deducted.
                    </p>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsWalletModalOpen(false)}
                      className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={walletMobileNumber.length !== 10}
                      className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/10 disabled:opacity-50"
                    >
                      Send OTP
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmPaymentViaWallet} className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-100 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-green-800">OTP Verification</h4>
                      <button
                        type="button"
                        onClick={() => setWalletOtpSent(false)}
                        className="text-[10px] text-green-600 hover:text-green-700 font-semibold underline"
                      >
                        Change Number
                      </button>
                    </div>
                    <p className="text-[10px] text-green-700">OTP sent to {walletMobileNumber}</p>
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit OTP"
                      value={walletOtp}
                      onChange={(e) => setWalletOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      maxLength="6"
                      className="w-full px-4 py-2.5 bg-white border border-green-200 rounded-xl text-xs text-gray-800 outline-none focus:border-green-400 font-mono tracking-widest text-center text-lg"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsWalletModalOpen(false)}
                      className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingWallet || walletOtp.length !== 6}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md shadow-green-600/10 disabled:opacity-50"
                    >
                      {submittingWallet ? 'Processing...' : `Pay ₹${pendingPayment.amount.toLocaleString('en-IN')}`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DOWNLOADABLE / PRINTABLE RENT INVOICE RECEIPT */}
      {isReceiptModalOpen && (selectedReceipt || receiptToPrint) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xs font-extrabold text-gray-800">Payment Receipt</h3>
              <button 
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setReceiptToPrint(null);
                }}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="print-receipt-container border border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50 space-y-6 text-xs text-gray-600">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-md font-black text-gray-800 tracking-tight pt-2">VastuSetu Rent Receipt</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Transaction Completed Successfully</p>
                </div>

                <div className="space-y-3.5 pt-4 border-t border-dashed border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Transaction ID</span>
                    <span className="text-gray-800 font-mono font-bold">{(selectedReceipt || receiptToPrint).transactionId || 'TXN' + Math.random().toString(36).substring(2, 9).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Apartment Flat</span>
                    <span className="text-gray-800 font-bold">Flat {(selectedReceipt || receiptToPrint).flatNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Billing Period</span>
                    <span className="text-gray-800 font-bold">{(selectedReceipt || receiptToPrint).month}/{(selectedReceipt || receiptToPrint).year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Tenant Resident</span>
                    <span className="text-gray-800 font-bold">{(selectedReceipt || receiptToPrint).tenantId?.name || user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Flat Landlord</span>
                    <span className="text-gray-800 font-bold">{(selectedReceipt || receiptToPrint).ownerId?.name || (flatDetails?.ownerUserId?.name || 'Owner')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Settle Date</span>
                    <span className="text-gray-800 font-bold">
                      {(selectedReceipt || receiptToPrint).paidAt ? new Date((selectedReceipt || receiptToPrint).paidAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="h-px bg-gray-200/50 my-2" />

                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-gray-800 font-bold">Total Amount Settle</span>
                    <span className="text-teal-600 font-black text-md">₹{((selectedReceipt || receiptToPrint).amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-gray-400 font-bold pt-4 border-t border-dashed border-gray-200">
                  Thank you for being a part of VastuSetu Society!
                </div>
              </div>

              <div className="flex gap-3">
                
                <button
                  type="button"
                  onClick={() => {
                    setIsReceiptModalOpen(false);
                    setReceiptToPrint(null);
                  }}
                  className="flex-1 border border-gray-100 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BOOK SERVICE REQUEST */}
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
                <label className="text-[11px] font-semibold text-gray-400">Explain Issues / Requirements</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain water leaks, electrical trips, door locking alignment issues..."
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
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/10"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MOCK CARD PAYMENT FOR ANCILLARY SERVICES */}
      {isServicePaymentModalOpen && selectedServicePayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Secure Service Fee Portal</h3>
                <p className="text-[9px] text-teal-600 font-bold">Paying for: {selectedServicePayment.name}</p>
              </div>
              <button 
                onClick={() => setIsServicePaymentModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayServiceCostSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 bg-gradient-to-br from-teal-600 to-emerald-700 rounded-xl text-white shadow-md flex flex-col justify-between h-32 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-4 -translate-y-4"></div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] tracking-widest font-black uppercase">VastuSetu Service Card</span>
                  <Building className="w-5 h-5" />
                </div>
                <div className="text-sm font-mono tracking-widest text-center">
                  {serviceCardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="flex justify-between items-center text-[9px] uppercase">
                  <div>
                    <p className="text-[7px] opacity-75">Card Holder</p>
                    <p className="font-bold">{serviceCardName || 'Full Name'}</p>
                  </div>
                  <div>
                    <p className="text-[7px] opacity-75">Expiry</p>
                    <p className="font-bold">{serviceCardExpiry || 'MM/YY'}</p>
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
                    value={serviceCardName}
                    onChange={(e) => setServiceCardName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4111 2222 3333 4444"
                    value={serviceCardNumber}
                    onChange={handleServiceCardNumberChange}
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
                      value={serviceCardExpiry}
                      onChange={handleServiceCardExpiryChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">CVV</label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      value={serviceCardCvv}
                      onChange={handleServiceCardCvvChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-semibold text-teal-800">Total Bill Cost:</span>
                  <span className="text-sm font-black text-teal-900">₹{selectedServicePayment.cost.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsServicePaymentModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                  disabled={submittingServicePayment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/10 flex items-center justify-center gap-1.5"
                  disabled={submittingServicePayment}
                >
                  {submittingServicePayment ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Pay ₹{selectedServicePayment.cost.toLocaleString('en-IN')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FILE MAINTENANCE COMPLAINT */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-extrabold text-gray-800">Raise Maintenance Ticket</h3>
              <button 
                onClick={() => setIsComplaintModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseComplaintSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Issue Category</label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 outline-none focus:bg-white focus:border-teal-300 transition-colors"
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
                  placeholder="e.g., Kitchen pipe leaking"
                  value={complaintTitle}
                  onChange={(e) => setComplaintTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-teal-300 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Detail Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the issue..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-teal-300 transition-colors resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400">Attachments (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setComplaintFiles(e.target.files)}
                  accept="image/png, image/jpeg"
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
                <span className="text-[9px] text-gray-400 font-bold block pt-1">Only JPEG/PNG up to 2MB allowed.</span>
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
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/10"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default TenantDashboard;