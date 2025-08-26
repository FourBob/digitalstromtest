const fs = require('fs');
const { loadConfig } = require('../src/core/RoomConfig');
const { FileStore } = require('../src/core/StateStore');
const { HeatingController } = require('../src/core/HeatingController');

class SimAdapter {
  constructor() {
    this.sensorStates = new Map(); // sensorId -> 'OPEN'|'CLOSE'
    this.roomSetpoints = new Map(); // roomName -> number
    this.roomCold = new Map();
    this.callbacks = [];
    this.manualCallbacks = new Map();
    this.schedules = new Map(); // roomName -> function(timestamp)->setpoint
  }

  async subscribeSensors(rooms) {
    this.rooms = rooms;
    // Initialize room setpoints to 21C if not set
    for (const r of rooms) {
      if (!this.roomSetpoints.has(r.name)) this.roomSetpoints.set(r.name, 21);
    }
  }

  async getOpenSensors(roomName, sensorIds) {
    return sensorIds.filter(id => this.sensorStates.get(id) === 'OPEN');
  }

  async getRoomSetpoint(roomName) {
    return this.roomSetpoints.get(roomName) ?? 21;
  }

  async setRoomSetpoint(roomName, valueC) {
    this.roomSetpoints.set(roomName, valueC);
    return true;
  }

  async getScheduledSetpoint(roomName, sinceTs) {
    const fn = this.schedules.get(roomName);
    if (fn) return fn(Date.now());
    return this.getRoomSetpoint(roomName);
  }

  async scheduleChangedSince(roomName, sinceTs) {
    // naive: always assume schedule changed if a schedule function exists
    return !!this.schedules.get(roomName);
  }

  async onManualSetpointChange(roomName, cb) {
    this.manualCallbacks.set(roomName, cb);
  }

  // Helpers for simulation
  async emitSensor(roomName, sensorId, event) {
    this.sensorStates.set(sensorId, event);
    for (const cb of this.callbacks) await cb({ sensorId, roomName, event });
  }
  onSensorEvent(cb) { this.callbacks.push(cb); }

  async emitManual(roomName, value) {
    const cb = this.manualCallbacks.get(roomName);
    if (cb) await cb(value);
  }
}

async function run() {
  const cfgObj = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
  const { rooms, policy } = loadConfig(cfgObj);
  const store = new FileStore();
  const adapter = new SimAdapter();
  const controller = new HeatingController(adapter, store, { rooms, policy });

  adapter.onSensorEvent(ev => controller.handleSensorEvent(ev));
  await controller.init();

  // Scenario: multi-sensor room
  console.log('Initial setpoints:', Object.fromEntries(adapter.roomSetpoints));
  await adapter.emitSensor('LivingRoom', 'sensor.living.window1', 'OPEN');
  console.log('After first OPEN:', Object.fromEntries(adapter.roomSetpoints));
  await adapter.emitSensor('LivingRoom', 'sensor.living.door', 'OPEN');
  console.log('After second OPEN:', Object.fromEntries(adapter.roomSetpoints));
  await adapter.emitSensor('LivingRoom', 'sensor.living.window1', 'CLOSE');
  console.log('After first CLOSE:', Object.fromEntries(adapter.roomSetpoints));
  await adapter.emitSensor('LivingRoom', 'sensor.living.door', 'CLOSE');
  console.log('After all CLOSED:', Object.fromEntries(adapter.roomSetpoints));

  // Scenario: manual change while open
  await adapter.emitSensor('Kitchen', 'sensor.kitchen.window', 'OPEN');
  console.log('Kitchen OPEN -> cold:', Object.fromEntries(adapter.roomSetpoints));
  await adapter.emitManual('Kitchen', 25);
  console.log('Manual change to 25 while open (will be reverted):', Object.fromEntries(adapter.roomSetpoints));
  // wait 4s to allow debounce revert
  await new Promise(r => setTimeout(r, 4000));
  console.log('After debounce revert:', Object.fromEntries(adapter.roomSetpoints));
  await adapter.emitSensor('Kitchen', 'sensor.kitchen.window', 'CLOSE');
  console.log('Kitchen CLOSED restore:', Object.fromEntries(adapter.roomSetpoints));
}

run().catch(e => { console.error(e); process.exit(1); });

