# Deploying to the server

A push to `dev` deploys itself. GitHub sends a signed webhook to the server, and the server pulls the code
and rebuilds the containers. Nothing in GitHub can log in to the server, and no secret is stored in git.

```
git push dev → GitHub webhook → listener on the server checks the signature and the branch
             → deploy/deploy.sh: git pull → docker compose up -d --build → health check
```

CI (`.github/workflows/ci.yml`) runs the tests on every push, separately. It does not gate the deploy.

## Server layout

| Address | What it is |
| --- | --- |
| https://learnonline.royaliqtech.com | the client (container `web`, published on `127.0.0.1:8085`) |
| https://learnonline-api.royaliqtech.com | the API (container `api`, published on `127.0.0.1:4000`) |
| https://learnonline-hooks.royaliqtech.com | the webhook listener (`127.0.0.1:9000`), only for GitHub |
| PostgreSQL | container `db`, no published port, data in the `pgdata` volume |

Each address is a CyberPanel / OpenLiteSpeed site that terminates HTTPS and proxies to its local port.

**The client and API are different origins but the same site** (both end in `royaliqtech.com`). That is why the
session cookie still works: the API sets it for its own host, `SameSite=Strict` allows it between sibling
subdomains, CORS allows only the client origin and the client sends `credentials: 'include'`. The client is
built with `VITE_API_URL=https://learnonline-api.royaliqtech.com/api/v1`.

## What is in `deploy/`

| File | Purpose |
| --- | --- |
| `hooks.json` | the listener's rule: run `deploy.sh` only if the request is signed with our secret **and** is for `refs/heads/dev` |
| `deploy.sh` | the deployment itself; it returns at once and works in the background (GitHub waits only 10 seconds) |
| `learnonline-webhook.service` | systemd unit that keeps the listener running on `127.0.0.1:9000` |

## Server files that are not in git

- `/opt/learnonline/.env`: `DB_PASSWORD`, `JWT_SECRET`, `CLIENT_ORIGIN`, `VITE_API_URL`, `WEB_BIND`, `API_BIND`
- `/etc/learnonline-webhook.env`: `HOOK_SECRET` (the same value is entered in GitHub)

## One-time setup

1. Docker with the Compose plugin (`apt install docker-compose-v2`).
2. The repo in `/opt/learnonline` (public, so it is cloned without credentials) and the `.env` above.
3. The listener: `apt install webhook`, copy `deploy/learnonline-webhook.service` to `/etc/systemd/system/`,
   create `/etc/learnonline-webhook.env` with `HOOK_SECRET=<random>`, then
   `systemctl daemon-reload && systemctl enable --now learnonline-webhook`.
4. CyberPanel: create three websites (client, API, hooks), issue SSL for each and add a Rewrite Rule:
   ```
   RewriteEngine On
   RewriteRule ^(.*)$ http://127.0.0.1:PORT/$1 [P]
   ```
   with `PORT` = `8085` for the client, `4000` for the API and `9000` for the hooks site.
   If the domains are behind Cloudflare, set its SSL mode to Full (strict).
5. GitHub: repo → Settings → Webhooks → Add webhook
   - Payload URL: `https://learnonline-hooks.royaliqtech.com/hooks/learnonline`
   - Content type: `application/json`
   - Secret: the `HOOK_SECRET`
   - Events: just the push event

## Why the webhook is safe to expose

- GitHub signs every request with the secret (HMAC-SHA256). Anything unsigned or wrongly signed is ignored.
- Only pushes to `dev` trigger it; other branches do nothing.
- It can only run `deploy.sh`, with no input taken from the request.
- The listener binds to `127.0.0.1`; only the reverse proxy reaches it.

## Useful commands (on the server)

```
journalctl -u learnonline-webhook -f      # did GitHub's request arrive?
tail -f /var/log/learnonline-deploy.log   # progress of a deployment
cd /opt/learnonline && docker compose ps  # what is running
docker compose logs -f api                # API logs
docker compose exec db pg_dump -U learn learnonline > backup.sql   # backup
```

After the first deploy, create the demo data if you want it: `docker compose exec api npm run db:seed`
(the demo accounts have public passwords, so skip this on a real site).
