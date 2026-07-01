#!/usr/bin/env bash
# Redeploys both the backend and frontend on the VPS.
# Run from the repo root (the directory containing this script).
# See DEPLOYMENT_HOSTINGER.md for the full one-time setup.
set -euo pipefail

echo "== Backend =="
cd backend
npm install
npm run db:generate
npm run db:migrate:prod
npm run build
pm2 restart prodigy-backend
cd ..

echo "== Frontend =="
npm install
npm run build

echo "Done. Nginx serves the new frontend/dist immediately; backend restarted via PM2."
