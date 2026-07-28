/**
 * PM2 process config for sales-arena (isolated on port 3005).
 *
 * Start:  pm2 start ecosystem.config.cjs
 * Logs:   pm2 logs sales-arena
 * Reload: pm2 reload sales-arena
 */
const path = require("path");
const fs = require("fs");

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
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

    env[key] = value;
  }

  return env;
}

const fileEnv = loadEnvFile(path.join(__dirname, ".env"));

module.exports = {
  apps: [
    {
      name: "sales-arena",
      cwd: __dirname,
      script: "npm",
      args: "run start:prod",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "3005",
        ...fileEnv,
      },
    },
  ],
};
