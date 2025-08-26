class HeatingController {
  constructor(adapter, stateStore, config) {
    this.adapter = adapter;
    this.state = stateStore;
    this.rooms = config.rooms; // Map name -> RoomConfig
    this.policy = config.policy;
    this.roomRuntime = new Map(); // name -> { openCount, openedAt, originalSetpoint }
  }

  async init() {
    // Subscribe to sensor events
    await this.adapter.subscribeSensors(Array.from(this.rooms.values()));

    // Initialize runtime state
    for (const [roomName, roomCfg] of this.rooms.entries()) {
      if (!roomCfg.enabled) continue;
      const openSensors = await this.adapter.getOpenSensors(roomName, roomCfg.sensors);
      if (openSensors.length > 0) {
        // enforce cold if not already
        await this._enterCold(roomName, roomCfg, true);
      }
    }
  }

  async handleSensorEvent({ sensorId, roomName, event }) {
    const roomCfg = this.rooms.get(roomName);
    if (!roomCfg || !roomCfg.enabled) return;

    const rt = this._ensureRuntime(roomName);
    if (event === 'OPEN') {
      rt.openCount = (rt.openCount || 0) + 1;
      if (rt.openCount === 1) {
        await this._enterCold(roomName, roomCfg, false);
      }
    } else if (event === 'CLOSE') {
      rt.openCount = Math.max(0, (rt.openCount || 0) - 1);
      if (rt.openCount === 0) {
        await this._restoreAfterClose(roomName, roomCfg);
      }
    }
  }

  _ensureRuntime(roomName) {
    if (!this.roomRuntime.has(roomName)) this.roomRuntime.set(roomName, {});
    return this.roomRuntime.get(roomName);
  }

  async _enterCold(roomName, roomCfg, initializing) {
    const rt = this._ensureRuntime(roomName);
    if (!rt.openedAt) rt.openedAt = Date.now();
    if (rt.openCount && rt.openCount > 0 && !initializing) return; // Already cold

    // Only capture original setpoint once
    if (rt.originalSetpoint == null) {
      rt.originalSetpoint = await this.adapter.getRoomSetpoint(roomName);
    }

    // Set to cold
    await this.adapter.setRoomSetpoint(roomName, roomCfg.coldSetpointC);

    // Optionally enforce no manual override by debounce revert
    if (!this.policy.allowManualOverrideDuringOpen) {
      await this.adapter.onManualSetpointChange(roomName, async (value) => {
        // Debounce revert
        setTimeout(async () => {
          const count = (this._ensureRuntime(roomName).openCount || 0);
          if (count > 0) {
            await this.adapter.setRoomSetpoint(roomName, roomCfg.coldSetpointC);
          }
        }, (this.policy.debounceSecondsForRevert || 3) * 1000);
      });
    }
  }

  async _restoreAfterClose(roomName, roomCfg) {
    const rt = this._ensureRuntime(roomName);
    const openedDurationMs = rt.openedAt ? (Date.now() - rt.openedAt) : 0;
    const thresholdMs = (this.policy.smartRestoreThresholdMinutes || 30) * 60 * 1000;

    // compare-and-swap: only overwrite if current equals cold
    const current = await this.adapter.getRoomSetpoint(roomName);
    if (current !== roomCfg.coldSetpointC) {
      // user changed manually at close time -> respect
      this._clearRuntime(roomName);
      return;
    }

    let target;
    if ((this.policy.closeRestoreMode || 'smart') === 'smart') {
      if (openedDurationMs >= thresholdMs || (await this.adapter.scheduleChangedSince(roomName, rt.openedAt))) {
        target = await this.adapter.getScheduledSetpoint(roomName, rt.openedAt);
      } else {
        target = rt.originalSetpoint;
      }
    } else if (this.policy.closeRestoreMode === 'original') {
      target = rt.originalSetpoint;
    } else { // 'schedule'
      target = await this.adapter.getScheduledSetpoint(roomName, rt.openedAt);
    }

    if (target != null) {
      await this.adapter.setRoomSetpoint(roomName, target);
    }
    this._clearRuntime(roomName);
  }

  _clearRuntime(roomName) {
    this.roomRuntime.set(roomName, {});
  }
}

module.exports = { HeatingController };

