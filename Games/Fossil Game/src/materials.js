const RESOURCE_DISPLAY = {
  coal: { name: 'Coal', icon: '●', mark: 'C' },
  iron: { name: 'Iron', icon: '■', mark: 'Fe' },
  copper: { name: 'Copper', icon: '▲', mark: 'Cu' },
  stone: { name: 'Stone', icon: '◆', mark: 'S' },
  sediment: { name: 'Sediment', icon: '◒', mark: 'D' },
  steel: { name: 'Steel', icon: '✦', mark: 'St' },
  concrete: { name: 'Concrete', icon: '▰', mark: 'Co' },
};

export function getCostDisplayRows(cost) {
  return Object.entries(cost).map(([resource, amount]) => {
    const display = RESOURCE_DISPLAY[resource];
    if (!display) {
      throw new RangeError(`unknown resource: ${resource}`);
    }
    if (!Number.isFinite(amount) || amount < 0) {
      throw new RangeError(`invalid ${resource} cost`);
    }

    return { resource, ...display, amount };
  });
}

export function getResourceDisplayRows(resources) {
  return Object.entries(RESOURCE_DISPLAY).map(([resource, display]) => ({
    resource,
    ...display,
    amount: Math.floor(resources[resource] || 0),
  }));
}

export function canAffordCost(resources, cost) {
  return Object.entries(cost).every(([resource, amount]) =>
    Number.isFinite(resources[resource]) && resources[resource] >= amount
  );
}
