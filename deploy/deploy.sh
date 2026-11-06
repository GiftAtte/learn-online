#!/bin/sh
# Deploys the latest `dev` branch. Started by the webhook listener (see deploy/hooks.json).
# It runs on the server, inside the app folder, and does three things: pull, rebuild, check.
set -eu

APP_DIR=/opt/learnonline
LOG=/var/log/learnonline-deploy.log

# GitHub gives up on a webhook after 10 seconds and a build takes minutes, so the real work
# runs in the background and this first call returns at once.
if [ -z "${DEPLOY_CHILD:-}" ]; then
  DEPLOY_CHILD=1 setsid "$0" >>"$LOG" 2>&1 </dev/null &
  exit 0
fi

cd "$APP_DIR"
echo "=== deploy started $(date -Is) ==="

# One deploy at a time: a second push waits for the first to finish.
exec 9>/tmp/learnonline-deploy.lock
flock 9

# 1. Get the code exactly as it is on GitHub (the repo is public, so no credentials are needed).
git fetch --quiet origin dev
git reset --hard origin/dev

# 2. Rebuild the images and restart only what changed. The .env file here holds the secrets.
docker compose up -d --build --remove-orphans
docker image prune -f

# 3. Check that both the client and the API answer.
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:8085/ && curl -fsS -o /dev/null http://127.0.0.1:4000/health; then
    echo "=== deploy finished, site is up $(date -Is) ==="
    exit 0
  fi
  sleep 2
done
echo "=== deploy finished but the site is NOT answering ===" >&2
exit 1
