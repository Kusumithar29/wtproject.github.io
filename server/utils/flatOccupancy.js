/**
 * Owner vs tenant occupancy rules:
 * - Owners legally own the flat (ownerUserId). May leave it vacant, live there (self_occupied), or rent to a tenant (rented).
 * - Tenants are temporary renters only (tenantUserId when occupancyMode is rented).
 */

const OCCUPANCY_MODES = ['vacant', 'self_occupied', 'rented', 'tenant_lease'];

const deriveOccupancyMode = (flat) => {
  if (!flat) return 'vacant';
  if (flat.occupancyMode && OCCUPANCY_MODES.includes(flat.occupancyMode)) {
    return flat.occupancyMode;
  }
  if (flat.tenantUserId && !flat.ownerUserId) return 'tenant_lease';
  if (flat.tenantUserId) return 'rented';
  if (flat.ownerUserId) return 'vacant';
  return 'vacant';
};

const deriveLegacyStatus = (occupancyMode) => {
  return occupancyMode === 'vacant' ? 'vacant' : 'occupied';
};

const getOccupancyLabel = (mode) => {
  switch (mode) {
    case 'rented':
      return 'Rented to tenant (owner)';
    case 'tenant_lease':
      return 'Tenant on lease (no owner on record)';
    case 'self_occupied':
      return 'Owner residing';
    case 'vacant':
    default:
      return 'Vacant (owner, unoccupied)';
  }
};

/**
 * Resolve occupancy from admin assignment inputs.
 */
const resolveOccupancyAssignment = ({ ownerUserId, tenantUserId, occupancyMode }) => {
  const hasOwner = !!(ownerUserId && String(ownerUserId).trim());
  const hasTenant = !!(tenantUserId && String(tenantUserId).trim());

  if (hasTenant && !hasOwner) {
    return {
      ownerUserId: null,
      tenantUserId,
      occupancyMode: 'tenant_lease',
      status: 'occupied'
    };
  }

  if (hasTenant) {
    return {
      ownerUserId,
      tenantUserId,
      occupancyMode: 'rented',
      status: 'occupied'
    };
  }

  if (!hasOwner) {
    return {
      ownerUserId: null,
      tenantUserId: null,
      occupancyMode: 'vacant',
      status: 'vacant'
    };
  }

  const mode = occupancyMode === 'self_occupied' ? 'self_occupied' : 'vacant';
  return {
    ownerUserId,
    tenantUserId: null,
    occupancyMode: mode,
    status: deriveLegacyStatus(mode)
  };
};

/**
 * Keep User.flatNumber aligned with Flat assignments.
 * - Tenants: flatNumber = rented flat.
 * - Owners (self_occupied): flatNumber = flat they live in.
 * - Owners (vacant/rented out): flatNumber cleared (ownership is on Flat.ownerUserId only).
 */
const syncUserFlatLinks = async (User, flat) => {
  const flatNumber = flat.flatNumber;
  const mode = deriveOccupancyMode(flat);

  const allUsers = await User.find({});
  for (const u of allUsers) {
    let nextFlat = u.flatNumber;

    if (u.role === 'tenant') {
      if (flat.tenantUserId && String(u._id) === String(flat.tenantUserId)) {
        nextFlat = flatNumber;
      } else if (u.flatNumber === flatNumber && String(u._id) !== String(flat.tenantUserId || '')) {
        nextFlat = null;
      }
    }

    if (u.role === 'owner') {
      if (flat.ownerUserId && String(u._id) === String(flat.ownerUserId)) {
        nextFlat = mode === 'self_occupied' ? flatNumber : null;
      } else if (u.flatNumber === flatNumber && String(u._id) !== String(flat.ownerUserId || '')) {
        nextFlat = null;
      }
    }

    if (nextFlat !== u.flatNumber) {
      const doc = await User.findById(u._id);
      if (doc) {
        doc.flatNumber = nextFlat;
        await doc.save();
      }
    }
  }
};

const canTenantPayRent = (flat) => {
  if (!flat || !flat.tenantUserId) return false;
  const mode = deriveOccupancyMode(flat);
  return mode === 'rented' || mode === 'tenant_lease';
};

module.exports = {
  OCCUPANCY_MODES,
  deriveOccupancyMode,
  deriveLegacyStatus,
  getOccupancyLabel,
  resolveOccupancyAssignment,
  syncUserFlatLinks,
  canTenantPayRent
};
