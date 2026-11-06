# LearnOnline

An online learning platform: browse a course catalog, enroll, watch video lessons with resume and
completion tracking, and follow progress on a dashboard. Administrators manage course content and review
learner progress.

- **Client:** React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Hook Form + Zod
- **API:** Node.js, Express 5, TypeScript, Prisma, PostgreSQL, Zod validation
- **Tests:** Vitest (API and client), Testing Library, Playwright (browser)

```
api/     Express + Prisma API         (see api/README.md for endpoints and security notes)
client/  React single-page app        (see client/README.md for structure and conventions)
e2e/     Playwright browser tests
```

## Quick start

### Option A: everything in Docker

```bash
docker compose up --build
docker compose exec api npm run db:seed      # demo data, once
```

Open <http://localhost:8080>. The API applies migrations on start. The web app is on port 8080 (`WEB_BIND` changes it); the database is also published on localhost:5432 (set `DB_PORT` if that port is taken).

### Option B: local development

Requires Node 22+ and Docker (for PostgreSQL) or your own PostgreSQL 14+.

```bash
npm run setup                    # installs api, client and e2e dependencies
cp api/.env.example api/.env     # then set JWT_SECRET (32+ characters)
npm run db:up                    # PostgreSQL on :5432 (docker)
npm run db:migrate
npm run db:seed                  # demo data
npm run dev:api                  # http://localhost:4000      (terminal 1)
npm run dev:client               # http://localhost:5173      (terminal 2)
```

## Seeding the database

The seed fills an empty database with the demo data: 2 accounts, 4 categories and 13 courses (12 published) with 38 lessons,
each lesson playing a free sample video (Blender films, MDN and W3C clips). It lives in `api/prisma/seed.ts`.

| Where | Command |
| --- | --- |
| Local development | `npm run db:seed` (from the repo root; the same script exists in `api/`) |
| Docker locally | `docker compose exec api npm run db:seed` |
| The server | `cd /opt/learnonline && docker compose exec api npm run db:seed` |

**Running it again deletes everything first**, including users, courses and progress, then recreates the demo data.
It is meant for an empty or throwaway database. The demo passwords are public, so to use your own, set them
for the run: `docker compose exec -e SEED_ADMIN_PASSWORD=... -e SEED_LEARNER_PASSWORD=... api npm run db:seed`.

Demo accounts (from the seed, for local use only):

| Role    | Email                   | Password    |
| ------- | ----------------------- | ----------- |
| Admin   | admin@learnonline.dev   | Admin123!   |
| Learner | learner@learnonline.dev | Learner123! |

> If something else already listens on port 4000, set `PORT` in `api/.env` and
> `API_PROXY_TARGET=http://127.0.0.1:<port>` when starting the client.

## Environment

API (`api/.env`, template in `api/.env.example`):

| Variable         | Purpose                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string                                          |
| `JWT_SECRET`     | Token signing key, at least 32 characters (the API refuses to start otherwise) |
| `JWT_EXPIRES_IN` | Token lifetime, for example `1h`                                      |
| `CLIENT_ORIGIN`  | Allowed CORS origin(s), comma-separated                               |
| `PORT`           | API port (default 4000)                                               |
| `TRUST_PROXY`    | Number of reverse proxies in front of the API (default 0)             |

Client: `VITE_API_URL` (default `/api/v1`, proxied to the API in development) in `client/.env.example`.

## Tests

| Command            | What it runs                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `npm test`         | API suite then client suite                                                                      |
| `npm run test:e2e` | Browser journeys with Playwright. Needs the database migrated and seeded; it starts its own API (port 4100) and client (port 5273) and uses the installed Chrome (`E2E_BROWSER=msedge` to change). |
| `npm run typecheck`| `tsc --noEmit` for both packages                                                                  |

API tests use a separate `learnonline_test` database (same Postgres server, migrations are applied automatically and tables are cleared before each test).

Results on the last full run:

| Suite  | Result                      | Covers                                                                                                        |
| ------ | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| API    | 8 files, **62 tests passed**| auth, token security and sign-out revocation, RBAC, validation, courses/lessons/categories, enrollment, progress and completion rules, dashboards, admin learner detail, role management |
| Client | 12 files, **62 tests passed**| API client, services, session and sign-out, route guards, video player (resume, progress, completion, seek, speed, errors), enroll actions, forms, UI primitives |
| E2E    | **5 tests passed**          | sign up, enroll, finish a lesson, see it on the dashboard; learner blocked from admin; admin sees the learner's lesson progress; guests redirected |

CI (`.github/workflows/ci.yml`) runs typecheck, format check, tests and the client build on every push.

## Features against the brief

| Requirement | Where |
| --- | --- |
| Sign-up, sign-in, protected routes, learner and admin roles | `api/src/modules/auth`, `middleware/authenticate.ts`, `authorize.ts`; `client/src/router/guards`, `core/hooks/queries/use-auth.ts` |
| Secure sessions | bcrypt, HS256 JWT with pinned algorithm, role loaded from the database on every request, real sign-out (token version), rate limiting, helmet, CORS allow-list |
| Course catalog with card layout (thumbnail, category, duration, progress) | `client/src/pages/browse/catalog-page.tsx`, `components/courses/course-card.tsx` |
| Course detail with lesson cards; focused video card with next-up lessons | `pages/learner/course-page.tsx`, `pages/learner/lesson-page.tsx`, `components/lessons` |
| Video: play, pause, seek, replay, speed, resume, completion at the end | `client/src/components/media/video-player.tsx`; rules in `api/src/modules/progress` |
| Enrollment and progress tracking, learner dashboard | `modules/enrollments`, `modules/progress`, `modules/dashboard`; `pages/learner/dashboard-page.tsx` |
| Admin: courses, lessons (order, metadata), categories, learners, drill-down per learner, promote to admin | `client/src/pages/admin/*`; `modules/courses`, `lessons`, `categories`, `users` |
| Loading, empty and error states; responsive and accessible UI | `QueryBoundary`, skeletons, `EmptyState`, `ErrorState`; mobile tab bar, tables become cards, Radix primitives, labelled controls |

## Architecture summary

**Shape.** A single-page React client talks to a versioned JSON API (`/api/v1`) over one response
envelope (`{ success, data, meta }` or `{ success: false, error }`). The API is layered per feature:
`routes` (URL and middleware) → `controller` (HTTP translation) → `service` (business rules, Prisma).
Input is validated with Zod at the edge; services never see unvalidated data.

**Decisions and trade-offs**

- **Authorization on the server, always.** The client hides screens a person cannot use, but every rule
  is enforced by the API. Roles are never read from the token or request body: each request loads the
  user, so role changes and deleted accounts apply immediately. Sign-out bumps a per-user token version,
  which revokes every older token without a token blocklist.
- **Token in an httpOnly cookie.** The API sets the sign-in token as a cookie that JavaScript cannot read
  (`HttpOnly`), so an XSS bug cannot steal it. `SameSite=Strict` stops other sites from making the browser
  send it (CSRF), `Secure` keeps it to HTTPS in production, and its `Path` limits it to the API. The client
  never sees or stores the token: it sends `credentials: 'include'` and asks `GET /auth/me` who is signed in.
  The cookie is the only place the token lives; there is no `localStorage` and no `Authorization` header.
- **Progress is derived, not stored.** Only per-lesson progress (position, completed) is saved; course
  percentages and statuses are computed, so they cannot drift. Completion is sticky and fires on the
  video `ended` event or at 95% watched; the server clamps positions to the lesson length.
- **Video URLs are access-controlled.** They are only returned to enrolled learners and admins; drafts
  are invisible to everyone else.
- **Relational integrity in the database.** Foreign keys with explicit delete behaviour (a category in
  use cannot be deleted, deleting a course cascades), unique constraints for `(user, course)` and
  `(course, lesson order)`, and upserts so concurrent progress saves cannot duplicate rows.
- **Admin aggregates are computed in memory.** Fine at this scale and easy to read; move to SQL
  `GROUP BY` for large datasets.
- **Rate limiting is per process.** Use a shared store such as Redis when running several instances.
- **Client state.** TanStack Query for server data (the signed-in user too), URL parameters for filters and paging, local state for everything else.
- **Design system.** Tokens in `client/src/styles/globals.css`; every page is a composition of shared
  blocks (`Page`, `Section`, `QueryBoundary`, `DataTable`) so screens behave the same.

**Known limits.** No refresh tokens or account lockout; demo videos are external sample clips; no
email verification or password reset; `npm audit` reports findings in the Prisma CLI's dev-time
tooling (documented in `api/README.md`).
