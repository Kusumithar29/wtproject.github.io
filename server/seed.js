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
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Flat = require('./models/Flat');
const Complaint = require('./models/Complaint');
const Payment = require('./models/Payment');
const Notice = require('./models/Notice');
const ParkingSlot = require('./models/ParkingSlot');
const WaterLog = require('./models/WaterLog');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const RefreshToken = require('./models/RefreshToken');
const { syncUserFlatLinks } = require('./utils/flatOccupancy');

const IDS = {
  admin: '7ace71fae2091ebbd167784f',
  manager: '5cb5dfc29594b8b04d415055',
  owner101: 'a659b4f8612d91387e048608',
  owner102: '4f12e907425f8a62673ac653',
  owner103: '436eb7711891c19842116a0a',
  tenant101: 'bebed8288cfe87bc71e37092',
  tenant102: '8189a248a81593cd639093d9',
  flat101: 'a801cb3489bc3cfa4b1c71c1',
  flat102: '5a6ba24ff396aa16eefc8935',
  flat103: '1e27bd9169d39cd3223f3845',
  flat104: 'b2c4e8f01a3d5e7f9b1c2d04',
  flat105: 'c3d5f9a12b4c6e8d0f2a4b51'
};

const profile = (base) => ({
  _id: base._id,
  username: base.username,
  name: base.name,
  email: base.email,
  personalEmail: base.personalEmail || '',
  password: base.password,
  plainPassword: base.plainPassword,
  role: base.role,
  phone: base.phone,
  gender: base.gender || '',
  dob: base.dob || '',
  occupation: base.occupation || '',
  aadhaarNumber: base.aadhaarNumber || '',
  profileImage: base.profileImage || '',
  flatNumber: base.flatNumber ?? null,
  address: base.address || {},
  emergencyContact: base.emergencyContact || {},
  status: 'active'
});

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vastusetu');
    console.log('📡 Connected for seeding...');

    await User.deleteMany({});
    await Flat.deleteMany({});
    await Complaint.deleteMany({});
    await Payment.deleteMany({});
    await Notice.deleteMany({});
    await ParkingSlot.deleteMany({});
    await WaterLog.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await RefreshToken.deleteMany({});
    console.log('🧹 Cleared all collections.');

    const salt = await bcrypt.genSalt(12);
    const hash = async (plain) => bcrypt.hash(plain, salt);

    const admin = await User.create(profile({
      _id: IDS.admin,
      username: 'superadmin',
      name: 'Arjun Sharma',
      email: 'admin@vastusetu.com',
      personalEmail: 'arjun.sharma@gmail.com',
      password: await hash('ADM123456'),
      plainPassword: 'ADM123456',
      role: 'admin',
      phone: '9876543210',
      gender: 'Male',
      dob: '1985-04-12',
      occupation: 'System Administrator',
      aadhaarNumber: 'XXXX-XXXX-4589',
      profileImage: 'uploads/profiles/admin.jpg',
      address: { street: 'MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      emergencyContact: { name: 'Priya Sharma', relation: 'Spouse', phone: '9988776655' }
    }));

    const manager = await User.create(profile({
      _id: IDS.manager,
      username: 'ravikumar',
      name: 'Ravi Kumar',
      email: 'manager@vastusetu.com',
      personalEmail: 'ravikumar@gmail.com',
      password: await hash('MNG123456'),
      plainPassword: 'MNG123456',
      role: 'manager',
      phone: '8765432109',
      gender: 'Male',
      dob: '1990-08-21',
      occupation: 'Apartment Manager',
      aadhaarNumber: 'XXXX-XXXX-7812',
      profileImage: 'uploads/profiles/manager.jpg',
      address: { street: 'Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066' },
      emergencyContact: { name: 'Suresh Kumar', relation: 'Brother', phone: '8877665544' }
    }));

    const owner101 = await User.create(profile({
      _id: IDS.owner101,
      username: 'owner101',
      name: 'Meera Reddy',
      email: 'owner101@vastusetu.com',
      personalEmail: 'meerareddy@gmail.com',
      password: await hash('OWN101101'),
      plainPassword: 'OWN101101',
      role: 'owner',
      flatNumber: '101',
      phone: '7654321098',
      gender: 'Female',
      dob: '1988-01-15',
      occupation: 'Software Engineer',
      aadhaarNumber: 'XXXX-XXXX-9021',
      profileImage: 'uploads/profiles/owner101.jpg',
      address: { street: 'Marathahalli', city: 'Bengaluru', state: 'Karnataka', pincode: '560037' },
      emergencyContact: { name: 'Raghav Reddy', relation: 'Husband', phone: '7766554433' }
    }));

    const owner102 = await User.create(profile({
      _id: IDS.owner102,
      username: 'owner102',
      name: 'Sanjay Verma',
      email: 'owner102@vastusetu.com',
      personalEmail: 'sanjayverma@gmail.com',
      password: await hash('OWN102102'),
      plainPassword: 'OWN102102',
      role: 'owner',
      flatNumber: '102',
      phone: '6543210987',
      gender: 'Male',
      dob: '1982-11-10',
      occupation: 'Businessman',
      aadhaarNumber: 'XXXX-XXXX-3412',
      profileImage: 'uploads/profiles/owner102.jpg',
      address: { street: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
      emergencyContact: { name: 'Kavita Verma', relation: 'Wife', phone: '6655443322' }
    }));

    const owner103 = await User.create(profile({
      _id: IDS.owner103,
      username: 'owner103',
      name: 'Anitha Rao',
      email: 'owner103@vastusetu.com',
      personalEmail: 'anitharao@gmail.com',
      password: await hash('OWN103103'),
      plainPassword: 'OWN103103',
      role: 'owner',
      flatNumber: '103',
      phone: '5432109876',
      gender: 'Female',
      dob: '1991-06-18',
      occupation: 'Doctor',
      aadhaarNumber: 'XXXX-XXXX-7755',
      profileImage: 'uploads/profiles/owner103.jpg',
      address: { street: 'HSR Layout', city: 'Bengaluru', state: 'Karnataka', pincode: '560102' },
      emergencyContact: { name: 'Vijay Rao', relation: 'Father', phone: '9988112233' }
    }));

    const tenant101 = await User.create(profile({
      _id: IDS.tenant101,
      username: 'tenant101',
      name: 'Kiran Patel',
      email: 'tenant101@vastusetu.com',
      personalEmail: 'kiranpatel@gmail.com',
      password: await hash('TEN101101'),
      plainPassword: 'TEN101101',
      role: 'tenant',
      flatNumber: '101',
      phone: '4321098765',
      gender: 'Male',
      dob: '1997-03-09',
      occupation: 'Data Analyst',
      aadhaarNumber: 'XXXX-XXXX-6621',
      profileImage: 'uploads/profiles/tenant101.jpg',
      address: { street: 'Bellandur', city: 'Bengaluru', state: 'Karnataka', pincode: '560103' },
      emergencyContact: { name: 'Rina Patel', relation: 'Mother', phone: '8877001122' }
    }));

    const tenant102 = await User.create(profile({
      _id: IDS.tenant102,
      username: 'tenant102',
      name: 'Neha Singh',
      email: 'tenant102@vastusetu.com',
      personalEmail: 'nehasingh@gmail.com',
      password: await hash('TEN102102'),
      plainPassword: 'TEN102102',
      role: 'tenant',
      flatNumber: '105',
      phone: '3210987654',
      gender: 'Female',
      dob: '1995-09-14',
      occupation: 'Teacher',
      aadhaarNumber: 'XXXX-XXXX-9981',
      profileImage: 'uploads/profiles/tenant102.jpg',
      address: { street: 'Electronic City', city: 'Bengaluru', state: 'Karnataka', pincode: '560100' },
      emergencyContact: { name: 'Raj Singh', relation: 'Brother', phone: '7766005544' }
    }));

    console.log('👤 Seeded users with enriched profiles.');

    const leaseStart = new Date();
    const leaseEnd = new Date();
    leaseEnd.setFullYear(leaseEnd.getFullYear() + 1);

    const flat101 = await Flat.create({
      _id: IDS.flat101,
      flatNumber: '101',
      floor: 1,
      ownerUserId: owner101._id,
      tenantUserId: tenant101._id,
      area: 1200,
      monthlyRent: 15000,
      occupancyMode: 'rented',
      status: 'occupied',
      leaseStart,
      leaseEnd
    });

    const flat102 = await Flat.create({
      _id: IDS.flat102,
      flatNumber: '102',
      floor: 1,
      ownerUserId: owner102._id,
      tenantUserId: null,
      area: 1200,
      monthlyRent: 15000,
      occupancyMode: 'self_occupied',
      status: 'occupied'
    });

    const flat103 = await Flat.create({
      _id: IDS.flat103,
      flatNumber: '103',
      floor: 2,
      ownerUserId: owner103._id,
      tenantUserId: null,
      area: 1400,
      monthlyRent: 18000,
      occupancyMode: 'vacant',
      status: 'vacant'
    });

    const flat104 = await Flat.create({
      _id: IDS.flat104,
      flatNumber: '104',
      floor: 2,
      ownerUserId: null,
      tenantUserId: null,
      area: 1100,
      monthlyRent: 14000,
      occupancyMode: 'vacant',
      status: 'vacant'
    });

    const flat105 = await Flat.create({
      _id: IDS.flat105,
      flatNumber: '105',
      floor: 2,
      ownerUserId: null,
      tenantUserId: tenant102._id,
      area: 1150,
      monthlyRent: 16000,
      occupancyMode: 'tenant_lease',
      status: 'occupied',
      leaseStart,
      leaseEnd
    });

    await syncUserFlatLinks(User, flat101);
    await syncUserFlatLinks(User, flat102);
    await syncUserFlatLinks(User, flat103);
    await syncUserFlatLinks(User, flat105);

    console.log('🏢 Flats: 101 rented, 102 self-occupied, 103 vacant, 104 inventory, 105 tenant lease (no owner).');

    await Complaint.create({
      title: 'Leaking Tap',
      description: 'Kitchen faucet leaking — Kiran Patel (flat 101).',
      raisedBy: tenant101._id,
      raisedByRole: 'tenant',
      flatNumber: '101',
      assignedTo: manager._id,
      status: 'open',
      category: 'plumbing'
    });

    await Complaint.create({
      title: 'Corridor Lights',
      description: 'Sanjay Verma reporting flickering lights near flat 102.',
      raisedBy: owner102._id,
      raisedByRole: 'owner',
      flatNumber: '102',
      assignedTo: manager._id,
      status: 'in-progress',
      category: 'electrical',
      managerNote: 'Electrician scheduled.'
    });

    await Notice.create({
      title: 'Annual General Meeting',
      body: 'AGM on Sunday 10 AM in the clubhouse.',
      postedBy: manager._id,
      audience: 'all'
    });

    await Notice.create({
      title: 'Rent Reminder',
      body: 'Monthly rent for leased flats is due by the 5th.',
      postedBy: manager._id,
      audience: 'tenants'
    });

    await ParkingSlot.create({ slotNumber: '101A', assignedTo: tenant101._id, flatNumber: '101', status: 'assigned' });
    await ParkingSlot.create({ slotNumber: '102A', assignedTo: owner102._id, flatNumber: '102', status: 'assigned' });
    await ParkingSlot.create({ slotNumber: '103A', assignedTo: null, flatNumber: null, status: 'available' });
    await ParkingSlot.create({ slotNumber: '104A', assignedTo: null, flatNumber: null, status: 'available' });
    await ParkingSlot.create({ slotNumber: '105A', assignedTo: tenant102._id, flatNumber: '105', status: 'assigned' });

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    await Payment.create({
      tenantId: tenant101._id,
      ownerId: owner101._id,
      flatNumber: '101',
      amount: 15000,
      month: currentMonth,
      year: currentYear,
      status: 'paid',
      transactionId: 'TXNSEED101',
      paidAt: new Date()
    });

    await Payment.create({
      tenantId: tenant102._id,
      ownerId: null,
      flatNumber: '105',
      amount: 16000,
      month: currentMonth,
      year: currentYear,
      status: 'pending'
    });

    console.log('✅ Seed complete. Demo logins:');
    console.log('   Admin: admin@vastusetu.com / ADM123456');
    console.log('   Manager: manager@vastusetu.com / MNG123456');
    console.log('   Owner 101: owner101@vastusetu.com / OWN101101');
    console.log('   Owner 102: owner102@vastusetu.com / OWN102102');
    console.log('   Owner 103: owner103@vastusetu.com / OWN103103');
    console.log('   Tenant 101: tenant101@vastusetu.com / TEN101101');
    console.log('   Tenant 105 (no owner): tenant102@vastusetu.com / TEN102102');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
