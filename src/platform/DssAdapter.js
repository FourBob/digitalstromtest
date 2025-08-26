// Placeholder adapter to be implemented with real dSS APIs
// Provide the following capabilities:
// - subscribeSensors(rooms)
// - getOpenSensors(roomName, sensorIds)
// - getRoomSetpoint(roomName)
// - setRoomSetpoint(roomName, valueC)
// - getScheduledSetpoint(roomName, sinceTs)
// - scheduleChangedSince(roomName, sinceTs)
// - onManualSetpointChange(roomName, callback)

class DssAdapter {
  constructor() {
    this.manualCallbacks = new Map();
  }

  async subscribeSensors(rooms) {
    // TODO: bind to dSS event bus
    // For each sensor in rooms[i].sensors subscribe to open/close events
  }

  async getOpenSensors(roomName, sensorIds) {
    // TODO: query dSS for current sensor states
    return [];
  }

  async getRoomSetpoint(roomName) {
    // TODO: fetch current target temperature for the room
    return 21;
  }

  async setRoomSetpoint(roomName, valueC) {
    // TODO: set target temperature for the room
    return true;
  }

  async getScheduledSetpoint(roomName, sinceTs) {
    // TODO: resolve the schedule-based setpoint (if available); fallback to current
    return this.getRoomSetpoint(roomName);
  }

  async scheduleChangedSince(roomName, sinceTs) {
    // TODO: detect if schedule would have changed since timestamp
    return false;
  }

  async onManualSetpointChange(roomName, callback) {
    // TODO: subscribe to manual setpoint change events; for now, store callback
    this.manualCallbacks.set(roomName, callback);
  }
}

module.exports = { DssAdapter };

