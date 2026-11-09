# LearnOnline

An online learning platform. Learners browse courses, enroll, watch video lessons (their own uploads or
YouTube) and follow their progress. Administrators manage courses, lessons, learners and the app's
settings.

- **Website:** React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Hook Form + Zod
- **Server:** Node.js, Express 5, TypeScript, Prisma, PostgreSQL, Zod validation
- **Tests:** Vitest (server and website), Testing Library, Playwright (browser)

## Quick start

With [Docker](https://www.docker.com) installed, this starts the database, the server and the website together:

```bash
docker compose up --build                    # build and start everything
docker compose exec api npm run db:seed      # add demo data (once)
```

Then open <http://localhost:8080> and sign in with a [demo account](#demo-accounts). Prefer to run the
server and website yourself while you work on the code? See [Run it](#run-it).

## Contents

1. [What is inside](#what-is-inside)
2. [Run it](#run-it): Docker, or on your computer, plus the demo accounts
3. [Seeding the database](#seeding-the-database)
4. [Environment settings](#environment-settings)
5. [What you can do](#what-you-can-do)
6. [Pages (website routes)](#pages-website-routes)
7. [API endpoints](#api-endpoints)
8. [Features against the brief](#features-against-the-brief)
9. [Commands and tests](#commands-and-tests)
10. [How it is built](#how-it-is-built): design decisions and known limits
11. [More documentation](#more-documentation)

## What is inside

```
api/      The server (Node.js, Express, Prisma, PostgreSQL)  -> see api/README.md
client/   The website (React, TypeScript, Vite)               -> see client/README.md
e2e/      Browser tests (Playwright)
```

## Run it

Pick one of the two ways. Option A needs only Docker. Option B is for working on the code.

### Option A: everything in Docker

You need [Docker](https://www.docker.com). Nothing else has to be installed.

```bash
docker compose up --build                    # builds and starts the database, server and website
docker compose exec api npm run db:seed      # adds demo data (do this once)
```

Open <http://localhost:8080>. The tables are created automatically when it starts.

- If port 8080 is taken, set `WEB_BIND` to another port, for example `WEB_BIND=8090`.
- If port 5432 is taken (you already run PostgreSQL), set `DB_PORT`, for example `DB_PORT=5433`.
- To stop it, press `Ctrl+C`. To remove the containers too, run `docker compose down`.

### Option B: on your computer, for development

You need [Node.js](https://nodejs.org) 22 or newer, and either Docker (for the database) or your own
PostgreSQL 14 or newer.

```bash
npm run setup                    # install everything
cp api/.env.example api/.env     # then open api/.env and set JWT_SECRET to any 32+ characters
npm run db:up                    # start the database (skip this if you use your own PostgreSQL)
npm run db:migrate               # create the tables
npm run db:seed                  # add demo courses and two demo accounts
npm run dev:api                  # the server: http://localhost:4000   (keep this terminal open)
npm run dev:client               # the website: http://localhost:5173  (use a second terminal)
```

Open <http://localhost:5173>. With your own PostgreSQL, put its address in `DATABASE_URL` in `api/.env`.

> If something else already uses port 4000, set `PORT` in `api/.env`, and start the website with
> `API_PROXY_TARGET=http://127.0.0.1:<that port>`.

### Demo accounts

Either way, sign in with one of these:

| Role          | Email                     | Password      |
| ------------- | ------------------------- | ------------- |
| Administrator | `admin@learnonline.dev`   | `Admin123!`   |
| Learner       | `learner@learnonline.dev` | `Learner123!` |

These accounts are for your own computer only. Never use them on a public site.

## Seeding the database

The seed fills an empty database with demo data: 2 accounts, 4 categories and 13 courses (12 published)
with 38 lessons, each playing a free sample video (Blender films, MDN and W3C clips). It lives in
`api/prisma/seed.ts`.

| Where | Command |
| --- | --- |
| Local development | `npm run db:seed` (from the repo root; the same script exists in `api/`) |
| Docker on your computer | `docker compose exec api npm run db:seed` |
| The server | `cd /opt/learnonline && docker compose exec api npm run db:seed` |

> **Running it again deletes everything first**, including users, courses and progress, then recreates the
> demo data. It is meant for an empty or throwaway database.

The demo passwords are public, so to use your own, set them for the run:
`docker compose exec -e SEED_ADMIN_PASSWORD=... -e SEED_LEARNER_PASSWORD=... api npm run db:seed`.

## Environment settings

**Server** (`api/.env`, with a template of every option in `api/.env.example`)

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign people in, 32+ characters. The server will not start without it. |
| `JWT_EXPIRES_IN` | How long one access token lasts (default `15m`). The refresh token renews it quietly |
| `REFRESH_TOKEN_DAYS` | How many days a sign-in lasts without being used (default 30) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | SMTP for password-reset emails. Defaults point at the Mailtrap sandbox; copy the credentials from Mailtrap > Email Testing > Inboxes > SMTP Settings. Without `MAIL_USER` the email is printed in the server log |
| `EMAIL_TOKEN_MINUTES` | How long a reset link works (default 60) |
| `CLIENT_ORIGIN` | Website address(es) the server accepts requests from (CORS), comma-separated |
| `PORT` | Server port (default 4000) |
| `TRUST_PROXY` | Number of reverse proxies in front of the server (default 0), so limits see real addresses |
| `AUTH_MAX_FAILED_ATTEMPTS` | Wrong passwords allowed per address before it is blocked (default 5) |
| `AUTH_LOCKOUT_MINUTES` | How long that block lasts before the count starts again (default 15) |
| `AUTH_RATE_LIMIT` | Sign-up attempts per address per 15 minutes (default 20) |
| `API_RATE_LIMIT` | Requests of any kind per address per 15 minutes (default 600) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional. Turn on uploading lesson videos and images. Without them, links and YouTube still work. |

**Website:** `VITE_API_URL` (default `/api/v1`, which the dev server forwards to the API), in
`client/.env.example`. `API_PROXY_TARGET` changes where the dev server forwards to.

**Docker Compose:** `WEB_BIND` (website port, default 8080), `DB_PORT` (database port, default 5432),
`DB_PASSWORD`.

**Seed:** `SEED_ADMIN_PASSWORD`, `SEED_LEARNER_PASSWORD` (see above). **Browser tests:** `E2E_BROWSER`
(`chrome` by default, or `msedge`).

## What you can do

**Learners**
- Browse and search the course catalog, enroll, and watch lessons. The video remembers where you stopped.
- See progress in **My learning** (pick up where you left off, filter, search) and on the **Progress** page.
- Change your name and password on your **Profile** (open it from your avatar).

**Administrators**
- Create courses, categories and lessons. A lesson's video can be uploaded, linked, or a YouTube video ID.
- See every learner and how far they have got in each course, and how each course is doing.
- Use **Settings** to change the app's name and logo, the allowed upload sizes and types, and whether
  new people can sign up.

## Pages (website routes)

Every address is written once in `client/src/router/paths.ts`, and `client/src/router/router.tsx` says who
may open each one. The guards enforce that column, and the server enforces it again.

| Address | Who can open it | What it is |
| --- | --- | --- |
| `/` | everyone | Landing page: what LearnOnline is, with sign-up and browse links |
| `/catalog` | visitors | Free course catalog (signed-in people are sent to `/learner/catalog`) |
| `/courses/:courseId` | visitors | Free course page with its lessons (signed-in people are sent to `/learner/courses/:courseId`) |
| `/sign-in`, `/sign-up` | visitors only | Sign in and create an account (sign-up can be closed in Settings) |
| `/forgot-password`, `/reset-password` | visitors only | Ask for a password-reset email, then choose a new password from the emailed link |
| `/learner/catalog` | signed in | The catalog inside the app |
| `/learner/courses/:courseId` | signed in | Course page: lessons, progress, enroll or leave |
| `/learner/lessons/:lessonId` | signed in | The video player with the course's lessons beside it |
| `/learner/my-learning` | signed in | Every course you are enrolled in: resume, filter, search, sort |
| `/learner/progress` | signed in | Totals, the lesson to resume, progress per course, recent activity |
| `/learner/dashboard` | signed in | Old address, redirects to `/learner/progress` |
| `/profile` | signed in | Your name and password, payment details (a preview only), sign out |
| `/admin` | administrators | Overview: totals, enrollments per course, the latest courses, recent enrollments |
| `/admin/courses` | administrators | All courses: search, filter, add, edit, publish, delete |
| `/admin/courses/:courseId` | administrators | One course's lessons: add, edit, reorder, delete, preview |
| `/admin/courses/:courseId/activity` | administrators | One course's activity: who is enrolled, how far, completions per lesson |
| `/admin/lessons` | administrators | Every lesson of every course in one table: search, filter by course, sort, edit, preview, delete |
| `/admin/categories` | administrators | Add, rename and delete categories |
| `/admin/learners` | administrators | Every learner with their progress in each course |
| `/admin/learners/:learnerId` | administrators | One learner, lesson by lesson. Can promote or demote them. |
| `/admin/settings` | administrators | Application name and logo, upload size and types, open or closed sign-ups |
| anything else | everyone | "Page not found" |

## API endpoints

The server is under `/api/v1`, plus `GET /health` (returns `{ "status": "ok" }`).

The sign-in token travels in an httpOnly cookie named `session`, set by sign-in and sign-up and removed by
sign-out. A second httpOnly cookie, `refresh` (sent only to `/auth/*`), renews it when it runs out; each refresh token works once. Clients only need to send cookies (`credentials: 'include'`).

**Access:** *public* = anyone, *user* = signed in, *enrolled* = signed in and enrolled in that course (or an
administrator), *admin* = administrators only.

| Method and path | Access | What it does |
| --- | --- | --- |
| **Account** | | |
| POST `/auth/register` | public | Sign up (always a learner). Refused when sign-ups are closed in Settings. |
| POST `/auth/login` | public | Sign in. Returns `{ user }` and sets the cookie. 5 wrong passwords block the address for 15 minutes. |
| GET `/auth/me` | user | The current user |
| PATCH `/auth/me` | user | Change your own name `{ name }` |
| POST `/auth/change-password` | user | `{ currentPassword, newPassword }`. Signs every other device out and keeps this one. A wrong current password is a 400 on that field. |
| POST `/auth/refresh` | refresh cookie | Trades the refresh cookie for a new session (rotation: each refresh token works once; reusing one ends every session of that person) |
| POST `/auth/forgot-password` | public | `{ email }`. Always 204; emails a single-use link if the account exists |
| POST `/auth/reset-password` | public | `{ token, password }`. Sets the new password, ends every session; the link works once |
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
| GET `/lessons` | admin | Every lesson of every course: `?q=` (title, description or course), `?courseId=`, `?sortBy=createdAt\|title\|course\|duration`, `?sortDir=`, `?page=`, `?pageSize=` |
| GET `/lessons/:id` | enrolled | A lesson with the course's other lessons and the next and previous ones |
| PATCH, DELETE `/lessons/:id` | admin | Update, or delete |
| GET, PUT `/lessons/:id/progress` | enrolled | Read, or save `{ positionSeconds, completed? }` for resume and completion |
| **Dashboards** | | |
| GET `/dashboard/learner` | user | Your totals, the lesson to resume, progress per course, recent activity |
| GET `/dashboard/admin` | admin | Totals, enrollments and completion per course, recent enrollments |
| GET `/dashboard/admin/learners` | admin | Learners with their progress: `?q=&enrolled=yes\|no&sortBy=&sortDir=&page=&pageSize=` |
| GET `/dashboard/admin/learners/:id` | admin | One learner: every enrolled course, lesson by lesson |
| GET `/dashboard/admin/courses/:id` | admin | One course's activity: enrolled learners, completions per lesson |

Every answer uses one shape: `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details? } }`.
Security notes and more detail are in [api/README.md](api/README.md).

## Features against the brief

| Requirement | Where |
| --- | --- |
| Sign-up, sign-in, password reset by email (Mailtrap), refresh tokens, protected routes, learner and admin roles | `api/src/modules/auth`, `api/src/modules/mail`, `middleware/authenticate.ts`, `authorize.ts`; `client/src/router/guards`, `core/hooks/queries/use-auth.ts` |
| Secure sessions | bcrypt, HS256 JWT with a pinned algorithm, role loaded from the database on every request, real sign-out (token version), rate limiting and a password-guess lockout, helmet, CORS allow-list |
| Profile: change name and password | `api/src/modules/auth` (`PATCH /auth/me`, `POST /auth/change-password`); `client/src/pages/profile-page.tsx` |
| Course catalog with card layout (thumbnail, category, duration, progress) | `client/src/pages/browse/catalog-page.tsx`, `components/courses/course-card.tsx` |
| Course detail with lesson cards; focused video card with next-up lessons | `pages/browse/course-page.tsx`, `pages/learner/lesson-page.tsx`, `components/lessons` |
| Video: play, pause, seek, replay, speed, resume, completion at the end | `client/src/components/media/video-player.tsx`; rules in `api/src/modules/progress` |
| YouTube lessons (by video ID) | `client/src/components/media/youtube-player.tsx`, `components/lessons/youtube-field.tsx`, `core/lib/youtube.ts` |
| Enrollment and progress tracking, learner dashboard, My learning | `modules/enrollments`, `modules/progress`, `modules/dashboard`; `pages/learner/progress-page.tsx`, `my-learning-page.tsx` |
| Admin: courses, lessons (order, metadata), categories, learners, drill-down per learner, promote to admin | `client/src/pages/admin/*` (including the all-lessons table, `lessons-page.tsx`); `modules/courses`, `lessons`, `categories`, `users` |
| Admin settings: app name and logo, upload size and file types, open or closed sign-ups | `api/src/modules/settings`; `client/src/pages/admin/settings-page.tsx` |
| Loading, empty and error states; responsive and accessible UI | `QueryBoundary`, skeletons, `EmptyState`, `ErrorState`; mobile-first fluid sizing (see "How it is built"), mobile tab bar, tables become cards, Radix primitives, labelled controls |

## Commands and tests

| Command | What it does |
| --- | --- |
| `npm test` | Runs the server suite, then the website suite |
| `npm run test:e2e` | Browser tests with Playwright. Needs the database migrated and seeded; it starts its own server (port 4100) and website (port 5273) and uses the installed Chrome (`E2E_BROWSER=msedge` to change it). |
| `npm run typecheck` | `tsc --noEmit` for both projects |
| `npm run build` | Builds both projects for production |
| `npm run db:up` | Starts the database in Docker |
| `npm run db:migrate` | Applies database migrations |
| `npm run db:seed` | Fills the database with demo data (it wipes first, see above) |

Server tests use a separate `learnonline_test` database on the same PostgreSQL; migrations are applied
automatically and the tables are cleared before each test. CI (`.github/workflows/ci.yml`) runs the type
check, format check, tests and the website build on every push.

### Test results

Last full run on the `dev` branch (typecheck and format check were clean too):

| Suite | Result | Covers |
| ----- | ------ | ------ |
| Server (Vitest) | 14 files, **99 tests passed** | sign-up and sign-in, token security, refresh-token rotation and sign-out, password reset, password-guess lockout, roles and access, input validation, courses, lessons and categories, enrollment, progress and completion rules, dashboards, settings, uploads |
| Website (Vitest) | 31 files, **143 tests passed** | API client and services, session and route guards, video players (resume, progress, completion, seek), upload and YouTube fields, forms, pages, UI parts |
| Browser (Playwright) | **28 tests passed** | sign up, enroll, finish a lesson and see it on the Progress page; learner blocked from admin; admin sees learner progress; settings and profile; YouTube lessons; My learning; course activity; an automated accessibility scan (axe, WCAG 2.1 A and AA) of every main screen on a desktop and a phone |

## How it is built

**Shape.** A single-page React website talks to a versioned JSON API (`/api/v1`) over one response
envelope. The server is layered per feature: `routes` (URL and middleware) → `controller` (HTTP
translation) → `service` (business rules, Prisma). Input is validated with Zod at the edge; services never
see unvalidated data.

**Decisions and trade-offs**

- **Authorization on the server, always.** The website hides screens a person cannot use, but every rule is
  enforced by the server. Roles are never read from the token or the request: each request loads the user,
  so role changes and deleted accounts apply immediately. Sign-out (and a password change) bumps a per-user
  token version, which revokes every older token without a blocklist.
- **Token in an httpOnly cookie.** JavaScript cannot read it, so an XSS bug cannot steal it. `SameSite=Strict`
  stops other sites making the browser send it (CSRF), `Secure` keeps it to HTTPS in production, and its
  `Path` limits it to the API. The website never sees or stores the token; it asks `GET /auth/me` who is
  signed in. There is no `localStorage` and no `Authorization` header.
- **Guessing passwords is slowed down.** Only failed sign-in and password-change attempts are counted: after
  5 wrong passwords an address is blocked for 15 minutes, then the count starts again.
- **Progress is derived, not stored.** Only per-lesson progress (position, completed) is saved; course
  percentages and statuses are computed, so they cannot drift. Completion is sticky and happens when the
  video ends or at 95% watched; the server clamps positions to the lesson length.
- **Video addresses are access-controlled.** They are returned only to enrolled learners and administrators;
  drafts are invisible to everyone else. A YouTube lesson stores a normal `youtube.com/watch?v=` address in
  the same field, and the lesson page picks YouTube's player when it sees one.
- **Uploads go straight to Cloudinary.** The server only signs the request (and decides which file types are
  allowed, from Settings), so large videos never pass through it.
- **Relational integrity in the database.** Foreign keys with explicit delete behaviour (a category in use
  cannot be deleted, deleting a course cascades), unique constraints for `(user, course)` and
  `(course, lesson order)`, and upserts so concurrent progress saves cannot duplicate rows.
- **Admin totals are computed in memory.** Fine at this scale and easy to read; move to SQL `GROUP BY` for
  large data.
- **Rate limits are per process.** Use a shared store such as Redis when running several instances.
- **Website state.** TanStack Query for server data (the signed-in user too), URL parameters for filters and
  paging, local state for everything else.
- **Mobile first.** The page's base font size is fluid: about 15px on a small phone, growing smoothly to
  17px on a desktop, so text, spacing and controls scale together. Buttons, the header, the tab bar,
  headings and cards are one step smaller on phones, while inputs keep 16px text so iOS does not zoom.
  Summary cards are one per row on phones, then two, then four; tables turn into cards on phones; and the
  admin menu is grouped (Overview, Content, People, Learner view), with the less-used links moved into the
  avatar menu on phones. A browser test (`e2e/tests/responsive.spec.ts`) keeps the scaling from silently
  disappearing, and the accessibility scan runs on a desktop and a phone.
- **Design system.** Tokens in `client/src/styles/globals.css`; every page is built from shared blocks
  (`Page`, `Section`, `SettingsSection`, `QueryBoundary`, `DataTable`) so screens behave the same.

**Known limits.** The lockout is per address, not per account; demo videos are external
sample clips; no email verification (password reset by email works, through Mailtrap in development); payment details on the profile page are a design
preview only; `npm audit` reports findings in the Prisma CLI's dev-time tooling (see `api/README.md`).

## More documentation

- [Architecture notes](docs/ARCHITECTURE.md): where each requirement lives in the code
- [Server details](api/README.md): setup, structure, security and key decisions
- [Website details](client/README.md): folders, conventions, state, design system, accessibility
- [Putting it on a server](DEPLOY.md)
