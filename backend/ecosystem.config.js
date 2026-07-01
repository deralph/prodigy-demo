// PM2 process configuration for the Prodigy Finance backend.
// Run from the backend/ directory with: pm2 start ecosystem.config.js --env production
module.exports = {
  apps: [
    {
      name: 'prodigy-backend',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,            // bump to 'max' for cluster mode once you outgrow a single core
      exec_mode: 'fork',       // change to 'cluster' if instances > 1
      autorestart: true,
      watch: false,            // never watch in production — restart manually after deploys
      max_memory_restart: '400M',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
