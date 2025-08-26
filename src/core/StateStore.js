const fs = require('fs');
const path = require('path');

class StateStore {
  async get(key) { throw new Error('Not implemented'); }
  async set(key, value) { throw new Error('Not implemented'); }
  async delete(key) { throw new Error('Not implemented'); }
}

// Simple JSON file-based store for simulation/local runs
class FileStore extends StateStore {
  constructor(filePath = path.join(__dirname, '../../state.json')) {
    super();
    this.filePath = filePath;
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}), 'utf-8');
    }
  }
  _read() {
    try { return JSON.parse(fs.readFileSync(this.filePath, 'utf-8') || '{}'); }
    catch { return {}; }
  }
  _write(obj) {
    fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), 'utf-8');
  }
  async get(key) { const obj = this._read(); return obj[key]; }
  async set(key, value) { const obj = this._read(); obj[key] = value; this._write(obj); }
  async delete(key) { const obj = this._read(); delete obj[key]; this._write(obj); }
}

module.exports = { StateStore, FileStore };

