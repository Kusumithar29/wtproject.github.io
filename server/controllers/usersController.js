const User = require('../models/User');
const bcrypt = require('bcryptjs');

const PROFILE_FIELDS = [
  'username', 'personalEmail', 'gender', 'dob', 'occupation',
  'aadhaarNumber', 'profileImage', 'address', 'emergencyContact', 'status'
];

const applyProfileFields = (user, body) => {
  for (const key of PROFILE_FIELDS) {
    if (body[key] !== undefined) user[key] = body[key];
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { flatNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const count = await User.countDocuments(query);
    const usersRaw = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const users = usersRaw.map((u) => {
      const obj = u.toObject ? u.toObject() : { ...u };
      delete obj.password;
      return obj;
    });

    res.status(200).json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalUsers: count
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const userDoc = await User.findById(req.params.id);
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete user.password;
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role, flatNumber, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role === 'tenant' && !flatNumber) {
      return res.status(400).json({ message: 'Flat number is required for tenants' });
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      plainPassword: password,
      role,
      flatNumber: role === 'tenant' ? flatNumber : (role === 'owner' ? flatNumber || null : null),
      phone,
      ...PROFILE_FIELDS.reduce((acc, key) => {
        if (req.body[key] !== undefined) acc[key] = req.body[key];
        return acc;
      }, {})
    });

    const userObj = user.toObject();
    delete userObj.password;
    if (!userObj.plainPassword && password) {
      userObj.plainPassword = password;
    }

    res.status(201).json({ success: true, user: userObj });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, email, password, role, flatNumber, phone } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    applyProfileFields(user, req.body);

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) {
      user.role = role;
      if (role === 'tenant') {
        user.flatNumber = flatNumber || null;
      } else if (role === 'owner') {
        user.flatNumber = flatNumber !== undefined ? flatNumber || null : user.flatNumber;
      } else {
        user.flatNumber = null;
      }
    } else if (flatNumber !== undefined) {
      if (user.role === 'tenant') {
        user.flatNumber = flatNumber || null;
      } else if (user.role === 'owner') {
        user.flatNumber = flatNumber || null;
      }
    }
    if (phone !== undefined) user.phone = phone;

    if (password) {
      // Validate password prefix for role in updates too
      const checkRole = role || user.role;
      if (checkRole === 'admin' && !/^ADM\d+$/.test(password)) {
        return res.status(400).json({ message: 'Admin password must start with "ADM" followed by digits' });
      }
      if (checkRole === 'manager' && !/^MNG\d+$/.test(password)) {
        return res.status(400).json({ message: 'Manager password must start with "MNG" followed by digits' });
      }
      if (checkRole === 'owner' && !/^OWN\d+$/.test(password)) {
        return res.status(400).json({ message: 'Owner password must start with "OWN" followed by digits' });
      }
      if (checkRole === 'tenant' && !/^TEN\d+$/.test(password)) {
        return res.status(400).json({ message: 'Tenant password must start with "TEN" followed by digits' });
      }
      
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(password, salt);
      user.plainPassword = password;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    if (!userObj.plainPassword && user.plainPassword) {
      userObj.plainPassword = user.plainPassword;
    }

    res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
