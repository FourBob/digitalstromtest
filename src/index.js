const fs = require('fs');
const { loadConfig } = require('./core/RoomConfig');
const { FileStore } = require('./core/StateStore');
const { HeatingController } = require('./core/HeatingController');
const { DssAdapter } = require('./platform/DssAdapter');

async function main() {
  const cfgObj = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
  const config = loadConfig(cfgObj);
  const store = new FileStore();
  const adapter = new DssAdapter();
  const controller = new HeatingController(adapter, store, config);
  await controller.init();

  // keep process alive (for simulation only)
  console.log('Heating controller initialized. Waiting for events...');
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

