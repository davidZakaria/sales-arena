/**
 * PM2 process config for sales-arena (isolated on port 3005).
 *
 * Start:  pm2 start ecosystem.config.cjs
 * Logs:   pm2 logs sales-arena
 * Reload: pm2 reload sales-arena
 */
const path = require("path");
const fs = require("fs");

// Load .env so DATABASE_URL, NEXTAUTH_*, etc. are available to the app
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

module.exports = {
  apps: [
    {
      name: "sales-arena",
      cwd: __dirname,
      script: path.join(__dirname, "node_modules/next/dist/bin/next"),
      interpreter: "node",
      args: "start -p 3005",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "3005",
        ...process.env,
      },
    },
  ],
};
