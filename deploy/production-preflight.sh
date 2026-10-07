#!/usr/bin/env bash
# Read-only production inventory. Never echo environment values or full PM2 dumps.
set -euo pipefail
anshkosh_node=/home/deploy/.nvm/versions/node/v22.23.2/bin/node
anshkosh_release="$($anshkosh_node -p 'JSON.parse(require("fs").readFileSync("/var/www/anshkosh-shared/state/current.json")).release')"
[[ "$anshkosh_release" =~ ^/var/www/anshkosh-releases/[0-9a-f]{40}\.[A-Za-z0-9]{8}$ ]] || exit 1
cd "$anshkosh_release"
printf 'Production release: %s\n' "$anshkosh_release"
free -m
df -h /var/www
systemctl is-active postgresql-15 redis nginx
stat -c 'Environment permissions: %a %U:%G' /var/www/anshkosh-shared/.env
for anshkosh_binary in pg_dump pg_restore initdb pg_ctl psql; do
  if [[ -x "/usr/pgsql-15/bin/$anshkosh_binary" ]]; then
    "/usr/pgsql-15/bin/$anshkosh_binary" --version
  else
    printf 'Missing PostgreSQL 15 binary: %s\n' "$anshkosh_binary"
  fi
done
rpm -q postgresql15 postgresql15-server || true
systemctl list-timers --all --no-pager 'anshkosh-*'
runuser -u deploy -- "$anshkosh_node" --env-file=/var/www/anshkosh-shared/.env --input-type=module <<'NODE'
import { createRequire } from 'node:module';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
try {
  const user = await db.user.findUnique({ where: { email: 'anshkosh@gmail.com' }, select: { emailVerified: true, banned: true, role: true } });
  console.log('Requested admin eligibility:', JSON.stringify(user));
  console.log('Startup count:', await db.startup.count());
  for (const name of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'BACKUP_R2_BUCKET', 'BACKUP_ENCRYPTION_KEY', 'BREVO_API_KEY', 'OPS_ALERT_EMAIL']) {
    console.log(`${name}: ${process.env[name] ? 'configured' : 'not configured'}`);
  }
  const pm2 = path.resolve(path.dirname(process.execPath), '../lib/node_modules/pm2/bin/pm2');
  const processes = JSON.parse(execFileSync(process.execPath, [pm2, 'jlist'], { encoding: 'utf8', timeout: 10000, env: { ...process.env, PM2_HOME: '/home/deploy/.pm2' } }));
  console.log('PM2 process summary:', JSON.stringify(processes.map(p => ({ name: p.name, status: p.pm2_env?.status, restarts: p.pm2_env?.restart_time, memoryMiB: Math.round((p.monit?.memory || 0) / 1048576) }))));
} finally { await db.$disconnect(); }
NODE
