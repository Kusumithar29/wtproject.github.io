const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' }
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  relation: { type: String, default: '' },
  phone: { type: String, default: '' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z\s]+$/.test(v);
      },
      message: 'Name can only contain alphabets and spaces'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  personalEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  plainPassword: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'owner', 'tenant'],
    required: [true, 'Role is required']
  },
  phone: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  dob: { type: String, default: '' },
  occupation: { type: String, default: '' },
  aadhaarNumber: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  flatNumber: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (this.role === 'tenant' && !v) {
          return false;
        }
        return true;
      },
      message: 'Flat number is required for tenants (current rental unit)'
    }
  },
  address: { type: addressSchema, default: () => ({}) },
  emergencyContact: { type: emergencyContactSchema, default: () => ({}) },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
