const restartPolicy = {
  autorestart: true,
  min_uptime: "10s",
  max_restarts: 10,
  exp_backoff_restart_delay: 1000,
};

const workerRuntime = {
  ...restartPolicy,
  cwd: __dirname,
  interpreter: "node",
  // Load configuration before tsx evaluates the workers' static imports.
  node_args: "--env-file=.env --import=tsx",
  env: { NODE_ENV: "production" },
  max_memory_restart: "256M",
};

module.exports = {
  apps: [
    {
      name: "anshkosh-web",
      ...restartPolicy,
      cwd: __dirname,
      script: "node_modules/.bin/next",
      args: "start --hostname 127.0.0.1",
      env: { PORT: 3000, NODE_ENV: "production" },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
    },
    {
      name: "worker-email",
      ...workerRuntime,
      script: "workers/email.ts",
    },
    {
      name: "worker-notification",
      ...workerRuntime,
      script: "workers/notification.ts",
    },
    {
      name: "worker-sync",
      ...workerRuntime,
      script: "workers/sync.ts",
    },
  ],
};
