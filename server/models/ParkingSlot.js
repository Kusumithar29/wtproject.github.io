const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  flatNumber: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['assigned', 'available'],
    default: 'available'
  }
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
