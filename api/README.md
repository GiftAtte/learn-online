# LearnOnline API

Node.js + Express + TypeScript, Prisma ORM, PostgreSQL.

## Setup

```bash
cd api
npm install
cp .env.example .env          # then set JWT_SECRET (32+ chars)
docker compose -f ../docker-compose.yml up -d db   # PostgreSQL on :5432 (or point DATABASE_URL at your own)
npx prisma migrate dev        # creates tables
npm run db:seed               # demo data: 2 accounts, 13 courses, 38 lessons (wipes the tables first; SEED_ADMIN_PASSWORD / SEED_LEARNER_PASSWORD override the demo passwords)
npm run dev                   # http://localhost:4000
```

Demo accounts (from the seed):

| Role    | Email                    | Password     |
| ------- | ------------------------ | ------------ |
| Admin   | admin@learnonline.dev    | Admin123!    |
| Learner | learner@learnonline.dev  | Learner123!  |

## Environment

| Variable         | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string              |
| `JWT_SECRET`     | Signing key, minimum 32 characters        |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1h`                 |
| `CLIENT_ORIGIN`  | Allowed CORS origin(s), comma-separated   |
| `PORT`           | Server port (default 4000)                |
| `TRUST_PROXY`    | Reverse proxies in front of the API (default 0); set it behind a proxy/load balancer so rate limiting sees real client IPs |

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run typecheck` · `npm test` · `npm run db:seed`

## Tests

`npm test` uses the `learnonline_test` database from `.env.test` (same Postgres server; `prisma migrate deploy` runs automatically, tables are cleared before each test).
Latest run: **9 files, 68 tests passing** (auth, token security and sign-out revocation, categories, courses/lessons + RBAC, validation, enrollment, progress/completion, dashboards, admin learner detail, role management, Cloudinary upload signatures).

## Structure

```
src/
  config/       env validation
  db/           prisma client
  middleware/   authenticate, authorize, validate, errorHandler
  utils/        AppError, response helpers, pagination, request helpers, jwt, password
  modules/<feature>/   routes -> controller -> service (+ zod schemas)
```

Layers: **routes** wire URL + middleware, **controllers** translate HTTP, **services** hold business rules and talk to Prisma.

## Response format

```jsonc
// success
{ "success": true, "data": ..., "meta": { "page": 1, "pageSize": 12, "total": 30, "totalPages": 3 } } // meta only on lists
// failure
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [{ "path": "email", "message": "..." }] } }
```

Codes: `VALIDATION_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## Endpoints (`/api/v1`)

Auth: the token travels in an httpOnly cookie named `session`, set by login/register and removed by logout. Clients only need to send cookies (`credentials: 'include'`).

| Method & path                          | Access   | Description                                   |
| -------------------------------------- | -------- | --------------------------------------------- |
| POST `/auth/register`                  | public   | Sign up (always a learner)                    |
| POST `/auth/login`                     | public   | Returns `{ user }` and sets the `session` cookie                     |
| GET `/auth/me`                         | user     | Current user                                  |
| POST `/auth/logout`                    | user     | Sign out everywhere: revokes every token issued so far |
| POST `/media/signature`                | admin    | Body `{ kind }`, where kind is `video` or `image`. Returns a signed, short-lived permission to upload one file straight to Cloudinary |
| PATCH `/users/:id/role`                | admin    | `{ role: 'LEARNER' | 'ADMIN' }`; admins can't change their own role |
| GET `/categories`                      | public   | Categories with published-course counts       |
| POST/PATCH/DELETE `/categories[/:id]`  | admin    | Manage categories (delete blocked while in use) |
| GET `/courses`                         | public   | Catalog: `?q=&categoryId=&page=&pageSize=`    |
| GET `/courses/:id`                     | public   | Course + lessons (video URLs for enrolled/admin only) |
| POST/PATCH/DELETE `/courses[/:id]`     | admin    | Manage courses                                |
| POST `/courses/:id/lessons`            | admin    | Add lesson (auto-ordered)                     |
| PUT `/courses/:id/lessons/reorder`     | admin    | `{ lessonIds: [...] }`                        |
| GET `/lessons/:id`                     | enrolled/admin | Lesson + sibling lessons + next/prev    |
| PATCH/DELETE `/lessons/:id`            | admin    | Update / delete lesson                        |
| POST/DELETE `/courses/:id/enroll`      | user     | Enroll (idempotent) / unenroll                |
| GET `/enrollments/me`                  | user     | My courses with progress                      |
| GET/PUT `/lessons/:id/progress`        | enrolled | `{ positionSeconds, completed? }` resume + completion |
| GET `/dashboard/learner`               | user     | Summary, continue-learning, recent activity   |
| GET `/dashboard/admin`                 | admin    | Totals, per-course enrollments & completion   |
| GET `/dashboard/admin/learners`        | admin    | Paginated learner progress                    |
| GET `/dashboard/admin/learners/:id`    | admin    | One learner: every enrolled course, lesson by lesson |

## Security

- **Passwords:** bcrypt-hashed, never returned; login errors are identical for unknown email and wrong password, with constant-time-ish behaviour.
- **Tokens:** HS256 JWT (algorithm pinned), expiring (`JWT_EXPIRES_IN`), stored in an **httpOnly, SameSite=Strict, Secure (production) cookie**, so scripts cannot read it and other sites cannot make the browser send it. The token holds the user id and a `tokenVersion`; `POST /auth/logout` bumps the version, so every earlier token is rejected immediately (real sign-out, not just forgetting the token in the browser); on every request the user is loaded from the database, so **role changes and deleted accounts take effect immediately**.
- **Authorization:** role checks live in middleware (401 not signed in / 403 wrong role). Sign-up always creates a learner. Video URLs are only returned to enrolled learners and admins; drafts are 404 to everyone else.
- **Input:** every body/param/query is validated with Zod; only `http(s)` URLs are accepted; JSON bodies are capped at 100kb; Prisma uses parameterised queries.
- **Abuse protection:** `helmet` headers, CORS allow-list (`CLIENT_ORIGIN`), a global rate limit (600 requests / 15 min / IP) and a stricter one on login/register (20 / 15 min / IP). Limits are in memory per process; use a shared store (e.g. Redis) when running several instances.
- **Errors:** one error shape; stack traces and internals are never sent in production.

Before deploying anywhere real:
- Replace the seeded demo accounts/passwords (the seed is for local development only) and set a long random `JWT_SECRET`.
- Serve over HTTPS and set `TRUST_PROXY` if behind a proxy.
- `npm audit` reports 3 high findings, all `deepmerge-ts` inside the **Prisma CLI** config loader (a dev-time tool, not used while serving requests). The fix is a major Prisma 7 upgrade, deferred.
- Not implemented: refresh tokens (access tokens are short-lived instead) and account lockout. The CORS allow-list and `SameSite=Strict` are the CSRF defence; a CSRF token would be the next step if the client and API ever lived on different sites.
- Roles: public sign-up always creates learners; an existing admin promotes others from the learner page (or `PATCH /users/:id/role`). Admins cannot change their own role, so the platform always keeps at least one admin.

## Key decisions

- **Progress rules:** completion fires on the video `ended` event or at ≥95% watched, and is sticky (re-watching never un-completes). Position is clamped to the lesson duration.
- **Access:** video URLs are withheld from anyone not enrolled (or admin). Role is never read from client input.
- **Categories are their own table:** courses reference them by `categoryId` (foreign key, `ON DELETE RESTRICT`), names are unique ignoring case, and a category with courses can't be deleted. Course responses embed `category: { id, name }`.
- **Computed, not stored:** course progress is derived from lesson progress, so it cannot go stale.
- **Trade-off:** admin dashboard aggregates in memory — fine at this scale; move to SQL `GROUP BY` for large datasets.
