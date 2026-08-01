const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Flat = require('../models/Flat');

const resolveReporterFlatNumber = async (user, bodyFlatNumber) => {
  if (user.role === 'tenant') {
    return user.flatNumber;
  }
  if (bodyFlatNumber) return bodyFlatNumber;
  if (user.flatNumber) return user.flatNumber;
  if (user.role === 'owner') {
    const owned = await Flat.find({ ownerUserId: user._id });
    if (owned.length === 1) return owned[0].flatNumber;
  }
  return null;
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, category, flatNumber: bodyFlat } = req.body;
    const raisedBy = req.user._id;
    const raisedByRole = req.user.role;
    const flatNumber = await resolveReporterFlatNumber(req.user, bodyFlat);

    if (!flatNumber) {
      return res.status(400).json({
        message: 'Specify which flat this complaint relates to (required for landlords with multiple units).'
      });
    }

    // Attachments from multer
    const attachments = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Find a manager to assign this complaint to
    const manager = await User.findOne({ role: 'manager' });
    const assignedTo = manager ? manager._id : null;

    const complaint = await Complaint.create({
      title,
      description,
      category,
      raisedBy,
      raisedByRole,
      flatNumber,
      assignedTo,
      attachments
    });

    res.status(201).json({ success: true, complaint });
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const role = req.user.role;
    let query = {};

    if (role === 'owner' || role === 'tenant') {
      query.raisedBy = req.user._id;
    }

    const complaints = await Complaint.find(query)
      .populate('raisedBy', 'name phone role flatNumber')
      .populate('assignedTo', 'name phone role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, complaints });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('raisedBy', 'name phone role flatNumber')
      .populate('assignedTo', 'name phone role');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Access check
    if (req.user.role === 'owner' || req.user.role === 'tenant') {
      if (complaint.raisedBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access Denied: You cannot view this complaint' });
      }
    }

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, managerNote } = req.body;
    const complaintId = req.params.id;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (status) complaint.status = status;
    if (managerNote !== undefined) complaint.managerNote = managerNote;

    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaintId)
      .populate('raisedBy', 'name phone role flatNumber')
      .populate('assignedTo', 'name phone role');

    // Notify the user via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.to(complaint.raisedBy.toString()).emit('complaint-update', populatedComplaint);
    }

    res.status(200).json({ success: true, complaint: populatedComplaint });
  } catch (error) {
    next(error);
  }
};
