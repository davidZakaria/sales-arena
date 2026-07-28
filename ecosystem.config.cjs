/**
 * PM2 process config for sales-arena (isolated on port 3005).
 *
 * Start:  pm2 start ecosystem.config.cjs
 * Logs:   pm2 logs sales-arena
 * Reload: pm2 reload sales-arena
 */
module.exports = {
  apps: [
    {
      name: "sales-arena",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3005,
      },
    },
  ],
};
