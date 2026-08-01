const Services = require('../models/Services');
const Flat = require('../models/Flat');

// Static available services list
const AVAILABLE_SERVICES = [
  { id: 'plumbing', name: 'Plumbing Service', category: 'Plumbing', description: 'Fix leaks, faucets, pipe blocks, and water flow issues.' },
  { id: 'electrical', name: 'Electrical Works', category: 'Electrical', description: 'Repair sockets, lights, fans, wiring issues, and power trips.' },
  { id: 'cleaning', name: 'Housekeeping & Cleaning', category: 'Cleaning', description: 'Flat deep cleaning, window washing, and waste disposal.' },
  { id: 'pest-control', name: 'Pest Control', category: 'Pest Control', description: 'General pest treatment, bed bugs, termites, and cockroach control.' },
  { id: 'security', name: 'Security Assistance', category: 'Security', description: 'Intercom repairs, key issues, CCTV concerns, and gate coordination.' },
  { id: 'carpentry', name: 'Carpentry & Woodwork', category: 'Carpentry', description: 'Door alignment, furniture repairs, lock replacements, and shelving.' }
];

exports.getAvailableServices = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, services: AVAILABLE_SERVICES });
  } catch (error) {
    next(error);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    const { name, category, description, flatNumber: bodyFlat } = req.body;
    const requestedBy = req.user._id;
    let flatNumber = req.user.flatNumber;

    if (!flatNumber && bodyFlat) flatNumber = bodyFlat;
    if (!flatNumber && req.user.role === 'owner') {
      const owned = await Flat.find({ ownerUserId: req.user._id });
      if (owned.length === 1) flatNumber = owned[0].flatNumber;
    }

    if (!flatNumber) {
      return res.status(400).json({ message: 'Specify the flat for this service request' });
    }

    const serviceRequest = await Services.create({
      name,
      category,
      description,
      flatNumber,
      requestedBy,
      status: 'Pending',
      cost: 0
    });

    const populatedRequest = await Services.findById(serviceRequest._id)
      .populate('requestedBy', 'name role phone');

    // Broadcast new service request to managers/admin via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new-service-request', populatedRequest);
    }

    res.status(201).json({ success: true, request: populatedRequest });
  } catch (error) {
    next(error);
  }
};

exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await Services.find({ requestedBy: req.user._id })
      .populate('requestedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

exports.getAllRequests = async (req, res, next) => {
  try {
    const requests = await Services.find({})
      .populate('requestedBy', 'name role phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

exports.updateRequest = async (req, res, next) => {
  try {
    const { status, cost } = req.body;
    const requestId = req.params.id;

    const request = await Services.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (cost !== undefined) updateFields.cost = Number(cost);

    const updatedRequest = await Services.findByIdAndUpdate(
      requestId,
      { $set: updateFields },
      { new: true }
    ).populate('requestedBy', 'name role phone');

    // Notify user of status update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('service-request-update', updatedRequest);
    }

    res.status(200).json({ success: true, request: updatedRequest });
  } catch (error) {
    next(error);
  }
};
