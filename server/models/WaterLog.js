const mongoose = require('mongoose');

const waterLogSchema = new mongoose.Schema({
  flatNumber: {
    type: String,
    required: true
  },
  previousReading: {
    type: Number,
    required: true
  },
  currentReading: {
    type: Number,
    required: true
  },
  units: {
    type: Number,
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Manager
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Pre-validate hook to calculate units
waterLogSchema.pre('validate', function(next) {
  if (this.currentReading !== undefined && this.previousReading !== undefined) {
    this.units = this.currentReading - this.previousReading;
  }
  next();
});

module.exports = mongoose.model('WaterLog', waterLogSchema);
