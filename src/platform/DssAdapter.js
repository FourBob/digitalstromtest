// Placeholder adapter to be implemented with real dSS APIs
// Provide the following capabilities:
// - subscribeSensors(rooms)
// - getOpenSensors(roomName, sensorIds)
// - getRoomSetpoint(roomName)
// - setRoomSetpoint(roomName, valueC)
// - getScheduledSetpoint(roomName, sinceTs)
// - scheduleChangedSince(roomName, sinceTs)
// - onManualSetpointChange(roomName, callback)

const fs = require('fs');
const path = require('path');
const { DssHttpClient } = require('./DssHttpClient');

class DssAdapter {
  constructor(opts = {}) {
    this.manualCallbacks = new Map();
    this.rooms = [];

    // Load secrets if available
    const secretsPath = path.join(process.cwd(), 'secrets.json');
    let secrets = {};
    if (fs.existsSync(secretsPath)) {
      secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
    }
    this.client = opts.client || new DssHttpClient({
      baseUrl: secrets.baseUrl || opts.baseUrl || 'https://dss.local',
      token: secrets.token || opts.token,
      username: secrets.username || opts.username,
      password: secrets.password || opts.password,
      rejectUnauthorized: secrets.rejectUnauthorized !== undefined ? secrets.rejectUnauthorized : true,
    });
  }

  async subscribeSensors(rooms) {
    this.rooms = rooms;
    // TODO: bind to dSS event bus
    // For each sensor in rooms[i].sensors subscribe to open/close events
    // Expose a method `emitSensorEvent` for now to allow manual wiring from outside.
  }

  async getOpenSensors(roomName, sensorIds) {
    // TODO: Implement via dSS JSON API
    // Placeholder: no knowledge of state, return empty
    return [];
  }

  async getRoomSetpoint(roomName) {
    // TODO: Replace with real endpoint
    // Example flow (VERIFY with dSS docs):
    // const res = await this.client.get('/json/climate/getRoomSetpoint', { room: roomName });
    // return res.valueC;
    return 21;
  }

  async setRoomSetpoint(roomName, valueC) {
    // TODO: Replace with real endpoint
    // Example (VERIFY): await this.client.post('/json/climate/setRoomSetpoint', { room: roomName, valueC });
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

  // For external wiring until real event bus implemented
  async emitSensorEvent(ev) {
    if (this._onSensorEvent) await this._onSensorEvent(ev);
  }
  onSensorEvent(cb) { this._onSensorEvent = cb; }
}

module.exports = { DssAdapter };

