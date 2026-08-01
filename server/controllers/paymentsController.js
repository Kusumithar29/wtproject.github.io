const Payment = require('../models/Payment');
const Flat = require('../models/Flat');
const User = require('../models/User');
const { canTenantPayRent } = require('../utils/flatOccupancy');
const crypto = require('crypto');

// Try to initialize Razorpay if SDK is installed and env vars present.
let razorpayInstance = null;
try {
  const Razorpay = require('razorpay');
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch (err) {
  // SDK not installed — continue in mock/payment-only mode to avoid crashing
  console.warn('Razorpay SDK not available, continuing without gateway integration.');
}

const generateMockTxnId = () => {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${Date.now()}${randomStr}`;
};

exports.initiate = async (req, res, next) => {
  try {
    const tenantId = req.user._id;
    const flatNumber = req.user.flatNumber;

    if (!flatNumber) {
      return res.status(400).json({ message: 'Tenant must be assigned to a flat' });
    }

    const flat = await Flat.findOne({ flatNumber });
    if (!flat) {
      return res.status(404).json({ message: 'Flat not found' });
    }

    if (String(flat.tenantUserId) !== String(tenantId)) {
      return res.status(403).json({ message: 'You are not registered as the tenant of this flat' });
    }

    if (!canTenantPayRent(flat)) {
      return res.status(400).json({
        message: 'Rent billing applies only to flats rented to a tenant. This unit is vacant or owner-occupied.'
      });
    }

    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const year = today.getFullYear();

    // Check if payment already exists
    let payment = await Payment.findOne({
      flatNumber,
      month,
      year
    });

    if (!payment) {
      payment = await Payment.create({
        tenantId,
        ownerId: flat.ownerUserId || null,
        flatNumber,
        amount: flat.monthlyRent,
        month,
        year,
        status: 'pending'
      });
    }

    // If Razorpay SDK/config available, create an order; otherwise return payment only
    if (razorpayInstance) {
      const amountInPaise = Math.round(payment.amount * 100);
      const orderOptions = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: payment._id.toString(),
        payment_capture: 1
      };

      const order = await razorpayInstance.orders.create(orderOptions);
      // Persist razorpay order id on payment record
      payment.razorpayOrderId = order.id;
      await payment.save();

      res.status(200).json({ success: true, payment, order, key: process.env.RAZORPAY_KEY_ID || '' });
    } else {
      const mockOrder = {
        id: `MOCK_ORDER_${payment._id}`,
        amount: Math.round(payment.amount * 100),
        currency: 'INR'
      };
      res.status(200).json({
        success: true,
        payment,
        order: mockOrder,
        key: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY || '',
        mock: true
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.confirm = async (req, res, next) => {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const tenantId = req.user._id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    if (payment.tenantId.toString() !== tenantId.toString()) {
      return res.status(403).json({ message: 'Access Denied: You cannot make this payment' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'This payment has already been completed' });
    }

    // If Razorpay fields are provided, verify signature
    if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ message: 'Payment signature verification failed' });
      }

      payment.status = 'paid';
      payment.transactionId = razorpayPaymentId;
      payment.paidAt = new Date();
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpayOrderId = razorpayOrderId;
      await payment.save();
    } else {
      // Fallback for older/mock flows: mark paid without gateway verification
      payment.status = 'paid';
      payment.transactionId = generateMockTxnId();
      payment.paidAt = new Date();
      await payment.save();
    }

    // Populate user names for socket payload
    const populatedPayment = await Payment.findById(payment._id)
      .populate('tenantId', 'name phone')
      .populate('ownerId', 'name phone');

    // Notify the owner via Socket.io
    const io = req.app.get('socketio');
    if (io && payment.ownerId) {
      io.to(payment.ownerId.toString()).emit('payment-notification', populatedPayment);
    }

    res.status(200).json({ success: true, payment: populatedPayment });
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const role = req.user.role;
    let query = {};

    if (role === 'owner') {
      query.ownerId = req.user._id;
    } else if (role === 'tenant') {
      query.tenantId = req.user._id;
    }

    const payments = await Payment.find(query)
      .populate('tenantId', 'name phone')
      .populate('ownerId', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('tenantId', 'name phone flatNumber')
      .populate('ownerId', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

exports.getPending = async (req, res, next) => {
  try {
    const role = req.user.role;
    let query = {};

    if (role === 'admin') {
      query.status = { $ne: 'paid' };
    } else if (role === 'owner') {
      query.ownerId = req.user._id;
      query.status = { $ne: 'paid' };
    } else {
      return res.status(403).json({ message: 'Access Denied' });
    }

    const payments = await Payment.find(query)
      .populate('tenantId', 'name phone')
      .populate('ownerId', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};
