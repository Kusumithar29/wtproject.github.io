const Flat = require('../models/Flat');
const User = require('../models/User');
const {
  deriveOccupancyMode,
  resolveOccupancyAssignment,
  syncUserFlatLinks
} = require('../utils/flatOccupancy');

const populateFlat = (query, includeEmail = true) => {
  const ownerFields = includeEmail ? 'name email phone flatNumber role' : 'name phone flatNumber role';
  const tenantFields = includeEmail ? 'name email phone flatNumber role' : 'name phone flatNumber role';
  return query
    .populate('ownerUserId', ownerFields)
    .populate('tenantUserId', tenantFields);
};

exports.getAll = async (req, res, next) => {
  try {
    const role = req.user.role;
    let flats = [];

    if (role === 'admin') {
      flats = await populateFlat(Flat.find(), true);
    } else if (role === 'manager') {
      flats = await populateFlat(Flat.find(), false);
    } else if (role === 'owner') {
      flats = await populateFlat(Flat.find({ ownerUserId: req.user._id }), false);
    } else if (role === 'tenant') {
      flats = await populateFlat(Flat.find({ tenantUserId: req.user._id }), false);
    }

    const enriched = flats.map((f) => {
      const obj = f.toObject ? f.toObject() : f;
      obj.occupancyMode = deriveOccupancyMode(obj);
      return obj;
    });

    res.status(200).json({ success: true, flats: enriched });
  } catch (error) {
    next(error);
  }
};

exports.getByFlatNumber = async (req, res, next) => {
  try {
    const { flatNumber } = req.params;
    const role = req.user.role;

    let flat;
    if (role === 'admin') {
      flat = await populateFlat(Flat.findOne({ flatNumber }), true);
    } else {
      flat = await populateFlat(Flat.findOne({ flatNumber }), false);
    }

    if (!flat) {
      return res.status(404).json({ message: 'Flat not found' });
    }

    const flatObj = flat.toObject ? flat.toObject() : flat;

    if (role === 'owner') {
      const isOwner = flatObj.ownerUserId && String(flatObj.ownerUserId._id || flatObj.ownerUserId) === String(req.user._id);
      if (!isOwner) {
        return res.status(403).json({ message: 'Access Denied: You do not own this flat' });
      }
    }

    if (role === 'tenant') {
      const isTenant = flatObj.tenantUserId && String(flatObj.tenantUserId._id || flatObj.tenantUserId) === String(req.user._id);
      if (!isTenant) {
        return res.status(403).json({ message: 'Access Denied: You are not the tenant of this flat' });
      }
    }

    flatObj.occupancyMode = deriveOccupancyMode(flatObj);
    res.status(200).json({ success: true, flat: flatObj });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { flatNumber, floor, area, monthlyRent, occupancyMode, status } = req.body;

    const existingFlat = await Flat.findOne({ flatNumber });
    if (existingFlat) {
      return res.status(400).json({ message: 'Flat number already exists' });
    }

    const mode = occupancyMode || 'vacant';
    const flat = await Flat.create({
      flatNumber,
      floor,
      area,
      monthlyRent,
      occupancyMode: mode,
      status: status || (mode === 'vacant' ? 'vacant' : 'occupied')
    });

    res.status(201).json({ success: true, flat });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { flatNumber } = req.params;
    const {
      floor,
      ownerUserId,
      tenantUserId,
      area,
      monthlyRent,
      status,
      occupancyMode,
      leaseStart,
      leaseEnd
    } = req.body;

    const flat = await Flat.findOne({ flatNumber });
    if (!flat) {
      return res.status(404).json({ message: 'Flat not found' });
    }

    if (floor !== undefined) flat.floor = floor;
    if (area !== undefined) flat.area = area;
    if (monthlyRent !== undefined) flat.monthlyRent = monthlyRent;
    if (leaseStart !== undefined) flat.leaseStart = leaseStart || null;
    if (leaseEnd !== undefined) flat.leaseEnd = leaseEnd || null;

    const resolvedOwner = ownerUserId !== undefined ? ownerUserId : flat.ownerUserId;
    const resolvedTenant = tenantUserId !== undefined ? tenantUserId : flat.tenantUserId;
    const resolvedMode = occupancyMode !== undefined ? occupancyMode : deriveOccupancyMode(flat);

    const assignment = resolveOccupancyAssignment({
      ownerUserId: resolvedOwner,
      tenantUserId: resolvedTenant,
      occupancyMode: resolvedMode
    });

    if (assignment.error) {
      return res.status(400).json({ message: assignment.error });
    }

    if (ownerUserId !== undefined || tenantUserId !== undefined || occupancyMode !== undefined) {
      if (assignment.ownerUserId) {
        const owner = await User.findById(assignment.ownerUserId);
        if (!owner || owner.role !== 'owner') {
          return res.status(400).json({ message: 'Invalid Owner user ID' });
        }
        flat.ownerUserId = assignment.ownerUserId;
      } else {
        flat.ownerUserId = null;
      }

      if (assignment.tenantUserId) {
        const tenant = await User.findById(assignment.tenantUserId);
        if (!tenant || tenant.role !== 'tenant') {
          return res.status(400).json({ message: 'Invalid Tenant user ID' });
        }
        if (String(tenant._id) === String(flat.ownerUserId)) {
          return res.status(400).json({ message: 'Owner and tenant must be different people' });
        }
        flat.tenantUserId = assignment.tenantUserId;
      } else {
        flat.tenantUserId = null;
      }

      flat.occupancyMode = assignment.occupancyMode;
      flat.status = assignment.status;
    } else if (status !== undefined) {
      flat.status = status;
    }

    await flat.save();
    await syncUserFlatLinks(User, flat);

    const updated = await populateFlat(Flat.findOne({ flatNumber }), true);
    const obj = updated.toObject ? updated.toObject() : updated;
    obj.occupancyMode = deriveOccupancyMode(obj);

    res.status(200).json({ success: true, flat: obj });
  } catch (error) {
    next(error);
  }
};
