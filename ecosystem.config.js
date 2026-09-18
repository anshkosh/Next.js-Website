module.exports = {
  apps: [
    {
      name: "anshkosh-web",
      script: "node_modules/.bin/next",
      args: "start",
      env: { PORT: 3000, NODE_ENV: "production" },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
    {
      name: "worker-email",
      script: "workers/email.ts",
      interpreter: "node_modules/.bin/tsx",
      autorestart: true,
    },
    {
      name: "worker-notification",
      script: "workers/notification.ts",
      interpreter: "node_modules/.bin/tsx",
      autorestart: true,
    },
    {
      name: "worker-sync",
      script: "workers/sync.ts",
      interpreter: "node_modules/.bin/tsx",
      autorestart: true,
    },
  ],
};
