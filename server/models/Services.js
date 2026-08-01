const mongoose = require('mongoose');

const servicesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  flatNumber: {
    type: String,
    required: [true, 'Flat number is required'],
    trim: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cost: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Services', servicesSchema);
