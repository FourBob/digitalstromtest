const https = require('https');
const { URL } = require('url');

class DssHttpClient {
  constructor({ baseUrl, token, username, password, rejectUnauthorized = true }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.username = username;
    this.password = password;
    this.rejectUnauthorized = rejectUnauthorized;
  }

  setToken(t) { this.token = t; }

  async get(pathname, params = {}) {
    return this._request('GET', pathname, params);
  }
  async post(pathname, body = {}) {
    return this._request('POST', pathname, {}, body);
  }

  _request(method, pathname, params = {}, body) {
    const u = new URL(this.baseUrl + pathname);
    // Attach token if present and not already specified
    if (this.token && !('token' in params)) params.token = this.token;
    for (const [k, v] of Object.entries(params)) {
      if (v != null) u.searchParams.set(k, String(v));
    }

    const payload = body ? JSON.stringify(body) : null;

    const options = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': payload ? Buffer.byteLength(payload) : 0,
        'User-Agent': 'ds-heating-add-on/1.0'
      },
      rejectUnauthorized: this.rejectUnauthorized
    };

    return new Promise((resolve, reject) => {
      const req = https.request(u, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              const err = new Error(`HTTP ${res.statusCode}: ${data}`);
              err.status = res.statusCode;
              err.body = json;
              reject(err);
            }
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${e.message}`));
          }
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }
}

module.exports = { DssHttpClient };

