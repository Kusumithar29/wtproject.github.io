const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
  flatNumber: {
    type: String,
    required: [true, 'Flat number is required'],
    unique: true,
    trim: true
  },
  floor: {
    type: Number,
    required: [true, 'Floor number is required']
  },
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tenantUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  area: {
    type: Number,
    required: [true, 'Area (sq ft) is required']
  },
  monthlyRent: {
    type: Number,
    required: [true, 'Monthly rent is required']
  },
  /** How the flat is used: vacant (empty), self_occupied (owner lives), rented (tenant on lease) */
  occupancyMode: {
    type: String,
    enum: ['vacant', 'self_occupied', 'rented', 'tenant_lease'],
    default: 'vacant'
  },
  /** @deprecated Use occupancyMode; kept for reports/charts */
  status: {
    type: String,
    enum: ['occupied', 'vacant'],
    default: 'vacant'
  },
  leaseStart: {
    type: Date,
    default: null
  },
  leaseEnd: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Flat', flatSchema);
