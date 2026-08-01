export const OCCUPANCY_LABELS = {
  vacant: 'Vacant — no resident',
  self_occupied: 'Self-occupied — owner lives here',
  rented: 'Rented — tenant on lease (owner on record)',
  tenant_lease: 'Tenant on lease — society / no owner on record'
};

export const getOccupancyMode = (flat) => {
  if (!flat) return 'vacant';
  if (flat.occupancyMode) return flat.occupancyMode;
  if (flat.tenantUserId && !flat.ownerUserId) return 'tenant_lease';
  if (flat.tenantUserId) return 'rented';
  if (flat.ownerUserId) return 'vacant';
  return 'vacant';
};

export const getOccupancyBadgeClass = (mode) => {
  switch (mode) {
    case 'rented':
      return 'bg-indigo-100 text-indigo-800';
    case 'tenant_lease':
      return 'bg-purple-100 text-purple-800';
    case 'self_occupied':
      return 'bg-amber-100 text-amber-800';
    case 'vacant':
    default:
      return 'bg-emerald-100 text-emerald-800';
  }
};

export const flatHasActiveTenant = (flat) => {
  const mode = getOccupancyMode(flat);
  return mode === 'rented' || mode === 'tenant_lease';
};
