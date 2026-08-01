// Mock mongoose globally before any other imports
const Module = require('module');
const path = require('path');
const originalRequire = Module.prototype.require;
const mockMongoosePath = path.join(__dirname, 'config', 'mockMongoose.js');
Module.prototype.require = function(id) {
  if (id === 'mongoose') {
    return originalRequire.call(this, mockMongoosePath);
  }
  return originalRequire.apply(this, arguments);
};

require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

async function test() {
  await connectDB();
  
  console.log('--- GET USERS ---');
  const query = {};
  const count = await User.countDocuments(query);
  console.log('Total users count:', count);
  
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(0)
    .limit(200);
  console.log('Users list length:', users.length);
  console.log('Users role filter (owner/tenant):', users.filter(u => u.role === 'owner' || u.role === 'tenant').map(u => ({ name: u.name, role: u.role, flatNumber: u.flatNumber })));

  console.log('\n--- GET COMPLAINTS ---');
  const complaints = await Complaint.find({})
    .populate('raisedBy', 'name phone role flatNumber')
    .populate('assignedTo', 'name phone role')
    .sort({ createdAt: -1 });
  console.log('Complaints list length:', complaints.length);
  console.log('Complaints details:', complaints.map(c => ({
    title: c.title,
    raisedBy: c.raisedBy,
    assignedTo: c.assignedTo,
    flatNumber: c.flatNumber,
    status: c.status
  })));
  
  process.exit(0);
}

test().catch((err) => {
  console.error(err);
  process.exit(1);
});
