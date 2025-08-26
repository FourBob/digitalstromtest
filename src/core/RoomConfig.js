class RoomConfig {
  constructor(name, { coldSetpointC, sensors, enabled }) {
    this.name = name;
    this.coldSetpointC = coldSetpointC;
    this.sensors = sensors || [];
    this.enabled = enabled !== false;
  }
}

function loadConfig(obj) {
  const rooms = new Map();
  const policy = {
    allowManualOverrideDuringOpen: false,
    debounceSecondsForRevert: 3,
    smartRestoreThresholdMinutes: 30,
    closeRestoreMode: "smart",
    ...(obj.policy || {})
  };
  const roomEntries = obj.rooms || {};
  for (const [name, cfg] of Object.entries(roomEntries)) {
    rooms.set(name, new RoomConfig(name, cfg));
  }
  return { rooms, policy };
}

module.exports = { RoomConfig, loadConfig };

