const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');

exports.getAll = async (req, res, next) => {
  try {
    const role = req.user.role;
    let slots = [];

    if (role === 'admin' || role === 'manager') {
      slots = await ParkingSlot.find().populate('assignedTo', 'name role flatNumber phone');
    } else if (role === 'tenant') {
      slots = await ParkingSlot.find({
        $or: [
          { assignedTo: req.user._id },
          { flatNumber: req.user.flatNumber }
        ]
      }).populate('assignedTo', 'name role flatNumber phone');
    } else if (role === 'owner') {
      const Flat = require('../models/Flat');
      const myFlats = await Flat.find({ ownerUserId: req.user._id });
      const flatNumbers = myFlats.map(f => f.flatNumber);
      slots = await ParkingSlot.find({
        $or: [
          { assignedTo: req.user._id },
          { flatNumber: { $in: flatNumbers } }
        ]
      }).populate('assignedTo', 'name role flatNumber phone');
    }

    res.status(200).json({ success: true, slots });
  } catch (error) {
    next(error);
  }
};

exports.assign = async (req, res, next) => {
  try {
    const { slotNumber, assignedTo, flatNumber } = req.body;

    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let slot = await ParkingSlot.findOne({ slotNumber });

    if (!slot) {
      // If slot doesn't exist, create it
      slot = new ParkingSlot({ slotNumber });
    }

    slot.assignedTo = assignedTo;
    slot.flatNumber = flatNumber || user.flatNumber;
    slot.status = 'assigned';

    await slot.save();

    const populatedSlot = await ParkingSlot.findById(slot._id)
      .populate('assignedTo', 'name role flatNumber phone');

    res.status(200).json({ success: true, slot: populatedSlot });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { slotNumber } = req.params;
    const { assignedTo, flatNumber, status } = req.body;

    let slot = await ParkingSlot.findOne({ slotNumber });
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '') {
        slot.assignedTo = null;
        slot.status = 'available';
      } else {
        const user = await User.findById(assignedTo);
        if (!user) return res.status(404).json({ message: 'User not found' });
        slot.assignedTo = assignedTo;
        slot.status = 'assigned';
      }
    }

    if (flatNumber !== undefined) slot.flatNumber = flatNumber;
    if (status !== undefined) slot.status = status;

    await slot.save();

    const populatedSlot = await ParkingSlot.findById(slot._id)
      .populate('assignedTo', 'name role flatNumber phone');

    res.status(200).json({ success: true, slot: populatedSlot });
  } catch (error) {
    next(error);
  }
};

exports.release = async (req, res, next) => {
  try {
    const { slotNumber } = req.params;

    const slot = await ParkingSlot.findOne({ slotNumber });
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    slot.assignedTo = null;
    slot.flatNumber = null;
    slot.status = 'available';

    await slot.save();

    res.status(200).json({ success: true, message: 'Parking slot released successfully', slot });
  } catch (error) {
    next(error);
  }
};
