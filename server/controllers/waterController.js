const WaterLog = require('../models/WaterLog');
const Flat = require('../models/Flat');

exports.getAll = async (req, res, next) => {
  try {
    const role = req.user.role;
    let logs = [];

    if (role === 'admin' || role === 'manager') {
      logs = await WaterLog.find()
        .populate('recordedBy', 'name role')
        .sort({ date: -1 });
    } else {
      const flatNumber = req.user.flatNumber;
      if (!flatNumber) {
        return res.status(400).json({ message: 'User flat number is not assigned' });
      }
      logs = await WaterLog.find({ flatNumber })
        .populate('recordedBy', 'name role')
        .sort({ date: -1 });
    }

    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { flatNumber, currentReading } = req.body;
    const recordedBy = req.user._id;

    // Check if flat exists
    const flat = await Flat.findOne({ flatNumber });
    if (!flat) {
      return res.status(404).json({ message: 'Flat not found' });
    }

    // Get last reading to auto-populate previousReading
    const lastLog = await WaterLog.findOne({ flatNumber }).sort({ date: -1 });
    const previousReading = lastLog ? lastLog.currentReading : 0;

    if (currentReading < previousReading) {
      return res.status(400).json({ message: `Current reading must be greater than or equal to previous reading (${previousReading})` });
    }

    const log = await WaterLog.create({
      flatNumber,
      previousReading,
      currentReading,
      recordedBy
    });

    const populatedLog = await WaterLog.findById(log._id)
      .populate('recordedBy', 'name role');

    res.status(201).json({ success: true, log: populatedLog });
  } catch (error) {
    next(error);
  }
};

exports.getByFlatNumber = async (req, res, next) => {
  try {
    const { flatNumber } = req.params;

    const logs = await WaterLog.find({ flatNumber })
      .populate('recordedBy', 'name role')
      .sort({ date: -1 });

    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};
