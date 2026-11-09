# LearnOnline API

Node.js + Express + TypeScript, Prisma ORM, PostgreSQL.

## Setup

**Everything in Docker (database, server and website together):** from the repository root run
`docker compose up --build`, then `docker compose exec api npm run db:seed` and open <http://localhost:8080>.
See "Run it" in the [root README](../README.md#run-it).

**Or run just the server on your computer** (Option B):

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
| `AUTH_RATE_LIMIT` | Sign-up attempts per address per 15 minutes (default 20; only the browser tests raise it) |
| `API_RATE_LIMIT` | Requests of any kind per address per 15 minutes (default 600; only the browser tests raise it) |
| `AUTH_MAX_FAILED_ATTEMPTS` | Wrong passwords (sign-in or password change) allowed per address before it is blocked (default 5) |
| `AUTH_LOCKOUT_MINUTES` | How long that block lasts before the count starts again (default 15) |
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

| Method and path | Access | What it does |
| --- | --- | --- |
| **Account** | | |
| POST `/auth/register` | public | Sign up (always a learner). Refused when sign-ups are closed in Settings. |
| POST `/auth/login` | public | Sign in. Returns `{ user }` and sets the cookie. 5 wrong passwords block the address for 15 minutes. |
| GET `/auth/me` | user | The current user |
| PATCH `/auth/me` | user | Change your own name `{ name }` |
| POST `/auth/change-password` | user | `{ currentPassword, newPassword }`. Signs every other device out and keeps this one. A wrong current password is a 400 on that field. |
| POST `/auth/logout` | user | Sign out everywhere: every earlier token stops working |
| PATCH `/users/:id/role` | admin | `{ role: 'LEARNER' \| 'ADMIN' }`. Administrators cannot change their own role. |
| **Settings and uploads** | | |
| GET `/settings` | public | App name, tagline, logo, support email, upload limits and file types, and whether sign-ups are open |
| PUT `/settings` | admin | Save those settings (blank optional text is cleared) |
| POST `/media/signature` | admin | `{ kind: 'video' \| 'image' }`. A signed, short-lived permission to upload one file straight to Cloudinary, limited to the file types in Settings. |
| **Categories** | | |
| GET `/categories` | public | Categories with their published-course counts |
| POST `/categories` | admin | Add a category |
| PATCH, DELETE `/categories/:id` | admin | Rename, or delete (blocked while courses use it) |
| **Courses** | | |
| GET `/courses` | public | The catalog: `?q=&categoryId=&status=&sortBy=&sortDir=&page=&pageSize=`. Learners only ever see published courses; `status` is for administrators. |
| GET `/courses/:id` | public | A course and its lessons. Video addresses are included for enrolled learners and administrators only. |
| POST `/courses` | admin | Create a course |
| PATCH, DELETE `/courses/:id` | admin | Update, or delete (its lessons go with it) |
| POST, DELETE `/courses/:id/enroll` | user | Enroll (safe to repeat) or leave (progress is kept) |
| GET `/enrollments/me` | user | The courses you are enrolled in, with your progress |
| **Lessons and progress** | | |
| POST `/courses/:id/lessons` | admin | Add a lesson (numbered automatically) |
| PUT `/courses/:id/lessons/reorder` | admin | `{ lessonIds: [...] }` sets the order |
| GET `/lessons` | admin | Every lesson of every course: `?q=` (title, description or course), `?courseId=`, `?sortBy=createdAt|title|course|duration`, `?sortDir=`, `?page=`, `?pageSize=` |
| GET `/lessons/:id` | enrolled | A lesson with the course's other lessons and the next and previous ones |
| PATCH, DELETE `/lessons/:id` | admin | Update, or delete |
| GET, PUT `/lessons/:id/progress` | enrolled | Read, or save `{ positionSeconds, completed? }` for resume and completion |
| **Dashboards** | | |
| GET `/dashboard/learner` | user | Your totals, the lesson to resume, progress per course, recent activity |
| GET `/dashboard/admin` | admin | Totals, enrollments and completion per course, recent enrollments |
| GET `/dashboard/admin/learners` | admin | Learners with their progress: `?q=&enrolled=yes\|no&sortBy=&sortDir=&page=&pageSize=` |
| GET `/dashboard/admin/learners/:id` | admin | One learner: every enrolled course, lesson by lesson |
| GET `/dashboard/admin/courses/:id` | admin | One course's activity: enrolled learners, completions per lesson |

## Security

- **Passwords:** bcrypt-hashed, never returned; login errors are identical for unknown email and wrong password, with constant-time-ish behaviour.
- **Tokens:** HS256 JWT (algorithm pinned), expiring (`JWT_EXPIRES_IN`), stored in an **httpOnly, SameSite=Strict, Secure (production) cookie**, so scripts cannot read it and other sites cannot make the browser send it. The token holds the user id and a `tokenVersion`; `POST /auth/logout` bumps the version, so every earlier token is rejected immediately (real sign-out, not just forgetting the token in the browser); on every request the user is loaded from the database, so **role changes and deleted accounts take effect immediately**.
- **Authorization:** role checks live in middleware (401 not signed in / 403 wrong role). Sign-up always creates a learner. Video URLs are only returned to enrolled learners and admins; drafts are 404 to everyone else.
- **Input:** every body/param/query is validated with Zod; only `http(s)` URLs are accepted; JSON bodies are capped at 100kb; Prisma uses parameterised queries.
- **Abuse protection:** `helmet` headers, CORS allow-list (`CLIENT_ORIGIN`), a global rate limit (600 requests / 15 min / IP), a limit on sign-up (20 / 15 min / IP), and a lockout on guessing passwords (only wrong passwords count: 5 per 15 min per IP on sign-in and password change, then blocked until the 15 minutes are up). Limits are in memory per process; use a shared store (e.g. Redis) when running several instances.
- **Errors:** one error shape; stack traces and internals are never sent in production.

Before deploying anywhere real:
- Replace the seeded demo accounts/passwords (the seed is for local development only) and set a long random `JWT_SECRET`.
- Serve over HTTPS and set `TRUST_PROXY` if behind a proxy.
- `npm audit` reports 3 high findings, all `deepmerge-ts` inside the **Prisma CLI** config loader (a dev-time tool, not used while serving requests). The fix is a major Prisma 7 upgrade, deferred.
- Not implemented: refresh tokens (access tokens are short-lived instead). The lockout is per IP address, not per account. The CORS allow-list and `SameSite=Strict` are the CSRF defence; a CSRF token would be the next step if the client and API ever lived on different sites.
- Roles: public sign-up always creates learners; an existing admin promotes others from the learner page (or `PATCH /users/:id/role`). Admins cannot change their own role, so the platform always keeps at least one admin.

## Key decisions

- **Progress rules:** completion fires on the video `ended` event or at ≥95% watched, and is sticky (re-watching never un-completes). Position is clamped to the lesson duration.
- **Access:** video URLs are withheld from anyone not enrolled (or admin). Role is never read from client input.
- **Categories are their own table:** courses reference them by `categoryId` (foreign key, `ON DELETE RESTRICT`), names are unique ignoring case, and a category with courses can't be deleted. Course responses embed `category: { id, name }`.
- **Computed, not stored:** course progress is derived from lesson progress, so it cannot go stale.
- **Trade-off:** admin dashboard aggregates in memory — fine at this scale; move to SQL `GROUP BY` for large datasets.
