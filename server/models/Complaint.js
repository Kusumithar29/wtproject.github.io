const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Complaint description is required']
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  raisedByRole: {
    type: String,
    enum: ['owner', 'tenant'],
    required: true
  },
  flatNumber: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the manager
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open'
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'security', 'cleanliness', 'other'],
    required: true
  },
  attachments: {
    type: [String], // Array of file paths
    default: []
  },
  managerNote: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
