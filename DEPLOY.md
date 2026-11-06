# Deploying to the server

A push to `dev` deploys itself, and the server never compiles anything. GitHub builds the Docker images and
the server only downloads them, so a deploy takes seconds and puts almost no load on the server.

```
git push dev
  → GitHub Actions: builds the api and web images, pushes them to ghcr.io (tagged with the commit)
  → GitHub Actions: over SSH, sends docker-compose.yml, then `docker compose pull` + `up -d`
  → health check; the run fails if the site does not answer
```

The tests (`api` and `client` jobs) run in the same workflow, alongside. They do not gate the deploy.

## Server layout

| Address | What it is |
| --- | --- |
| https://learnonline.royaliqtech.com | the client (container `web`, published on `127.0.0.1:8085`) |
| https://learnonline-api.royaliqtech.com | the API (container `api`, published on `127.0.0.1:4000`) |
| PostgreSQL | container `db`, no published port, data in the `pgdata` volume |

Each address is a CyberPanel / OpenLiteSpeed site that terminates HTTPS and proxies to its local port.

**The client and API are different origins but the same site** (both end in `royaliqtech.com`). That is why the
session cookie still works: the API sets it for its own host, `SameSite=Strict` allows it between sibling
subdomains, CORS allows only the client origin and the client sends `credentials: 'include'`. The client image is
built with `VITE_API_URL=https://learnonline-api.royaliqtech.com/api/v1`.

## What lives on the server

`/opt/learnonline/` holds only two files: `docker-compose.yml` (sent by every deploy) and `.env` (secrets, never in
git): `DB_PASSWORD`, `JWT_SECRET`, `CLIENT_ORIGIN`, `VITE_API_URL`, `WEB_BIND`, `API_BIND` and
`REGISTRY=ghcr.io/giftatte/learn-online`, plus `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` for uploads (see "File uploads" below). No source code and no build tools are needed there.

## One-time setup

1. Docker with the Compose plugin on the server (`apt install docker-compose-v2`) and the folder above.
2. A deploy key: `ssh-keygen -t ed25519 -f deploy_key -N ""`. Append `deploy_key.pub` to the server's
   `~/.ssh/authorized_keys`.
3. GitHub: repo → Settings → Environments → `production` → add these secrets:

   | Secret | Value |
   | --- | --- |
   | `DEPLOY_HOST` | server IP or hostname |
   | `DEPLOY_USER` | SSH user |
   | `DEPLOY_PATH` | `/opt/learnonline` |
   | `DEPLOY_SSH_KEY` | contents of the private `deploy_key` |
   | `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan -t ed25519 <host>` |

4. CyberPanel: create two websites (client and API), issue SSL for each and add a Rewrite Rule:
   ```
   RewriteEngine On
   RewriteRule ^(.*)$ http://127.0.0.1:PORT/$1 [P]
   ```
   with `PORT` = `8085` for the client and `4000` for the API. If the domains are behind Cloudflare, set its SSL
   mode to Full (strict).

The workflow logs the server in to ghcr.io with the run's short-lived `GITHUB_TOKEN` and logs it out again, so no
registry password is stored on the server.

## Useful commands (on the server, in `/opt/learnonline`)

```
docker compose ps                  # what is running
docker compose logs -f api         # API logs
docker compose exec db pg_dump -U learn learnonline > backup.sql   # backup
```

To roll back, run `IMAGE_TAG=<older commit sha> docker compose up -d --no-build` (the old images are still in the
registry).

After the first deploy, create the demo data (2 accounts, 13 courses, 38 lessons with free sample videos):
`cd /opt/learnonline && docker compose exec api npm run db:seed`. It deletes all existing data first, so run it only on a fresh database.
Set `SEED_ADMIN_PASSWORD` and `SEED_LEARNER_PASSWORD` (`docker compose exec -e ... api npm run db:seed`) to avoid the public demo passwords. The demo passwords are public, so on a real site always set your own.

## File uploads (Cloudinary)

Administrators can upload lesson videos and cover images in the course and lesson forms, instead of pasting links.
Files are stored in Cloudinary (free plan is enough). The server only signs the upload; the browser sends the file
straight to Cloudinary, so big videos never pass through our server.

1. Create a free account at https://cloudinary.com. On the dashboard copy the **Cloud name**, **API key** and **API secret**.
2. Add them to `/opt/learnonline/.env` on the server:
   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
3. Restart the API so it reads them. The server has pre-built images and no source code, so tell compose which image tag is
   running and not to build:
   ```
   cd /opt/learnonline
   IMAGE_TAG=$(docker inspect learnonline-api-1 --format '{{.Config.Image}}' | cut -d: -f2) docker compose up -d --no-build api
   ```
   (A plain `docker compose up -d api` fails with "path /opt/learnonline/api not found", because it tries to build.)

Until they are set, the upload buttons answer "File uploads are not set up yet" and links keep working.
The API secret stays on the server and is never sent to the browser.
