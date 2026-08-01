const Visitor = require('../models/Visitor');

exports.createVisitor = async (req, res, next) => {
  try {
    const { name, purpose, flatNumber, phone } = req.body;

    const visitor = await Visitor.create({
      name,
      purpose,
      flatNumber,
      phone,
      checkIn: new Date(),
      checkOut: null
    });

    // Broadcast real-time visitor update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('visitor-update', { action: 'check-in', visitor });
    }

    res.status(201).json({ success: true, visitor });
  } catch (error) {
    next(error);
  }
};

exports.getAllVisitors = async (req, res, next) => {
  try {
    // Both Admin and Manager can see all.
    // If we want owners and tenants to see, we can filter, but the prompt only places this on Admin/Manager sidebars.
    const visitors = await Visitor.find({}).sort({ checkIn: -1 });
    res.status(200).json({ success: true, visitors });
  } catch (error) {
    next(error);
  }
};

exports.checkoutVisitor = async (req, res, next) => {
  try {
    const visitorId = req.params.id;
    const visitor = await Visitor.findById(visitorId);

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    if (visitor.checkOut) {
      return res.status(400).json({ message: 'Visitor already checked out' });
    }

    visitor.checkOut = new Date();
    await visitor.save();

    // Broadcast real-time visitor update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('visitor-update', { action: 'check-out', visitor });
    }

    res.status(200).json({ success: true, visitor });
  } catch (error) {
    next(error);
  }
};
