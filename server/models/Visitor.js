const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Visitor name is required'],
    trim: true
  },
  purpose: {
    type: String,
    required: [true, 'Purpose of visit is required'],
    trim: true
  },
  flatNumber: {
    type: String,
    required: [true, 'Flat number is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Visitor phone number is required'],
    trim: true
  },
  checkIn: {
    type: Date,
    default: Date.now
  },
  checkOut: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Visitor', visitorSchema);
