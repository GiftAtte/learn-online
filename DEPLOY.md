# Deploying to the server

One workflow, `.github/workflows/ci.yml`, for the whole monorepo (api, client, e2e). Every push is tested.
A push to `main` that passes is deployed: the code is copied to the server with rsync and
`docker compose up -d --build` rebuilds the containers. Secrets stay on the server in `.env`, never in git.

```
git push → CI (typecheck, format, tests, build) → rsync to server → docker compose up -d --build → health check
```

## Server layout

| Address | What it is |
| --- | --- |
| https://learnonline.royaliqtech.com | the client (container `web`, published on `127.0.0.1:8085`) |
| https://learnonline-api.royaliqtech.com | the API (container `api`, published on `127.0.0.1:4000`) |
| PostgreSQL | container `db`, no published port, data in the `pgdata` volume |

Each address is a CyberPanel / OpenLiteSpeed site that terminates HTTPS and proxies to its local port.

**The two addresses are different origins but the same site** (both end in `royaliqtech.com`). That is why the
session cookie still works: the API sets it for its own host, `SameSite=Strict` allows it between sibling
subdomains, CORS allows only the client origin and the client sends `credentials: 'include'`. The client is
built with `VITE_API_URL=https://learnonline-api.royaliqtech.com/api/v1`.

## One-time server setup

1. Docker Compose plugin: `apt install docker-compose-v2`
2. App folder: `mkdir -p /opt/learnonline`
3. `/opt/learnonline/.env` (chmod 600):
   ```
   DB_PASSWORD=<long random>
   JWT_SECRET=<long random, 32+ characters>
   CLIENT_ORIGIN=https://learnonline.royaliqtech.com
   VITE_API_URL=https://learnonline-api.royaliqtech.com/api/v1
   WEB_BIND=127.0.0.1:8085
   API_BIND=127.0.0.1:4000
   ```
   Generate values with `openssl rand -hex 32`.
4. CyberPanel: create two websites, issue an SSL certificate for each, and add a Rewrite Rule to each:
   - `learnonline.royaliqtech.com` →
     ```
     RewriteEngine On
     RewriteRule ^(.*)$ http://127.0.0.1:8085/$1 [P]
     ```
   - `learnonline-api.royaliqtech.com` → the same rule with port `4000`.
   If the domains are behind Cloudflare, set its SSL mode to Full (strict).
5. A deploy key for the pipeline: `ssh-keygen -t ed25519 -f deploy_key -N ""`, append `deploy_key.pub` to the
   server's `~/.ssh/authorized_keys`.

## GitHub setup

Repository → Settings → Environments → `production` → add these secrets:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | server IP or hostname |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_PATH` | `/opt/learnonline` |
| `DEPLOY_SSH_KEY` | contents of the private `deploy_key` |
| `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan -t ed25519 <host>` |

Optionally require a reviewer on the `production` environment to approve each deploy.

## First deploy only

After the first run, create the demo data if you want it: `docker compose exec api npm run db:seed`
(the demo accounts have public passwords, so skip this on a real site).

## Useful commands (on the server, in the app folder)

```
docker compose ps              # what is running
docker compose logs -f api     # API logs
docker compose exec db pg_dump -U learn learnonline > backup.sql   # backup
```
