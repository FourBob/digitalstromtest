# digitalSTROM Heating Control Add-On (Preparation)

Goal: An add-on that sets room temperature to a configurable "cold" setpoint when any door/window in the room opens, and restores to the correct value when all are closed.

This repository contains a platform-agnostic core implementation plus a thin adapter layer for the digitalSTROM Server (dSS). The dSS adapter is a placeholder – integrate with the actual dSS Scripting/JSON API in `src/platform/DssAdapter.js`.

## Features
- Event-driven reaction to door/window open/close
- Per-room configuration and cold setpoints
- Open-counter (multiple sensors per room)
- Smart-restore: original vs. scheduled setpoint (threshold-based)
- Manual-change policy: no manual override while open (debounced revert)
- Persistent state store (pluggable provider)

## Project structure
```
src/
  core/
    HeatingController.js   # core policy + state machine
    StateStore.js          # generic key-value store (pluggable backend)
    RoomConfig.js          # configuration schema helpers
  platform/
    DssAdapter.js          # TODO: bind to dSS APIs here
  index.js                 # wiring: adapter + controller
config.json                # example configuration

tests/
  simulation.js            # event simulation to exercise logic
```

## How to run the simulator (Node.js)
- Requires Node.js >= 16
- No external dependencies

```
node tests/simulation.js
```

## Integration with dSS
- Implement missing methods in `src/platform/DssAdapter.js` to:
  - subscribe to door/window sensor events
  - read/write room temperature setpoints
  - read scheduled setpoint (if available) or return current policy
  - optionally subscribe to manual setpoint changes (if dSS exposes such events)
- Ensure a persistent storage API is used (replace FileStore with dSS storage if available)

## Manual change policy (default)
- allowManualOverrideDuringOpen: false
- debounceSecondsForRevert: 3
- smartRestoreThresholdMinutes: 30
- closeRestoreMode: "smart" (scheduled if long-open or schedule changed, else original)

See `nextsteps.txt` for the detailed plan and acceptance criteria.

