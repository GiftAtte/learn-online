# LearnOnline

An online learning platform. Learners browse courses, enroll, watch video lessons (their own uploads or
YouTube) and follow their progress. Administrators manage courses, lessons, learners and the app's
settings.

## What is inside

```
api/      The server (Node.js, Express, Prisma, PostgreSQL)
client/   The website (React, TypeScript, Vite, Tailwind CSS)
e2e/      Browser tests (Playwright)
docs/     How it is built, and what each requirement maps to
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

### Demo accounts

Either way, sign in with one of these:

| Role          | Email                     | Password      |
| ------------- | ------------------------- | ------------- |
| Administrator | `admin@learnonline.dev`   | `Admin123!`   |
| Learner       | `learner@learnonline.dev` | `Learner123!` |

These accounts are for your own computer only. Never use them on a public site.

## What you can do

**Learners**
- Browse and search the course catalog, enroll, and watch lessons. The video remembers where you stopped.
- See progress in **My learning** (pick up where you left off, filter, search) and on the **Progress** page.
- Change your name and password on your **Profile** (open it from your avatar).

**Administrators**
- Create courses, categories and lessons. A lesson's video can be uploaded, linked, or a YouTube video ID.
- See every learner and how far they have got in each course.
- Use **Settings** to change the app's name and logo, the allowed upload sizes and types, and whether
  new people can sign up.

## Modules, as set out in the assessment brief

Every module of the brief, with what was built and where to see it. File paths are explained in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### 1. Authentication and access

| Requirement | Done | How it works |
| --- | --- | --- |
| User sign-up and sign-in | ✅ | `/sign-up` and `/sign-in`, with inline validation and a show/hide password toggle |
| Protected pages and routes | ✅ | Signed-out visitors are sent to sign in; signed-in people cannot open the sign-in pages. The API checks every request too. |
| Role-based access (learner, administrator) | ✅ | Roles are loaded from the database on every request, never taken from the browser. Learners are blocked from `/admin`, and admin endpoints answer 403. |
| Secure session or token handling | ✅ | Token in an httpOnly, SameSite=Strict cookie; bcrypt passwords; sign-out and password changes revoke old tokens; 5 wrong passwords block an address for 15 minutes |

### 2. Course and lesson management

| Requirement | Done | How it works |
| --- | --- | --- |
| Create, read, update and delete courses | ✅ | Admin → **Courses** (search, filter, sort, paging, publish or keep as draft) |
| Manage lessons under each course | ✅ | Open a course to add, edit, delete and reorder its lessons (move up and move down) |
| Metadata: title, description, duration, category, lesson order | ✅ | Courses have title, description, category, cover image. Lessons have title, description, video, length and order. A course's duration is the total of its lessons. |
| Validation and graceful handling of invalid input | ✅ | The same rules run in the form and on the server; errors appear next to the field, and a category that still has courses cannot be deleted |

### 3. Video lesson experience

| Requirement | Done | How it works |
| --- | --- | --- |
| Open a lesson page with a video player | ✅ | `/learner/lessons/:id`: the video sits in a main content card. Videos can be uploaded, linked, or a YouTube video. |
| Play, pause, seek and replay | ✅ | Also skip 10 seconds, speed, mute, fullscreen and keyboard shortcuts |
| Completion when the lesson is watched to the end | ✅ | Completes when the video ends (or at 95% watched); it stays complete when re-watched |
| Resume from the last watched position | ✅ | The position is saved every 10 seconds, on pause and when leaving the page; the button reads "Resume" |
| Progress saved and shown in the learner dashboard | ✅ | **Progress** page and **My learning**, including a "Continue learning" card |
| Related lessons as cards with status and progress | ✅ | Lesson cards beside the player: Completed, % watched with a bar, Up next, Not started |

### 4. Enrollment and progress tracking

| Requirement | Done | How it works |
| --- | --- | --- |
| Browse available courses and enroll | ✅ | Catalog with search and category filter; **Enroll** on the course page (and **Leave course**) |
| Track completion across lessons | ✅ | Per-lesson completion rolls up into course status: Not started, In progress, Completed |
| Progress persists and is shown correctly | ✅ | Saved in the database; percentages are calculated, never stored, so they cannot drift |
| Dashboard summary: enrolled courses, active learning, completion | ✅ | **Progress** page: enrolled courses, in progress, lessons completed, minutes watched, overall progress ring, recent activity |

### 5. Admin experience

| Requirement | Done | How it works |
| --- | --- | --- |
| Create and manage course content | ✅ | Courses, lessons and categories under the admin menu |
| Review learner progress and course activity | ✅ | **Learners** (with a drill-down per learner) and **Course activity** (who is enrolled, who finished each lesson) |
| Access restricted by role | ✅ | Pages, API and menus all depend on the role |
| Data presented clearly and consistently | ✅ | **Overview** with summary cards, plus tables that turn into cards on phones; **Settings** for the app name, logo, upload rules and sign-ups |

### 6. User experience

| Requirement | Done | How it works |
| --- | --- | --- |
| Responsive for desktop and mobile | ✅ | Built mobile first and checked from 320px up; summary cards are one per row on phones |
| Loading, empty and error states | ✅ | Skeletons while loading, friendly empty states, and error screens with a retry |
| Reusable components and thoughtful state handling | ✅ | Shared page, card, table and form pieces; server data cached with TanStack Query |
| Clear validation and feedback | ✅ | Inline field errors, confirmations before deleting, and toast messages |
| Accessible | ✅ | Labelled controls, keyboard support, and an automated axe check of every main screen |

### Look and layout

| Requirement | Done | Where |
| --- | --- | --- |
| Course cards: title, category, description, thumbnail, duration, progress indicator | ✅ | Catalog and My learning. Courses you have not enrolled in show an empty bar and "Not enrolled". |
| A selected course opens into lesson cards | ✅ | Course page |
| Lesson opens in a focused video card | ✅ | Lesson page |
| Related or next-up lessons as smaller cards | ✅ | Beside the player on desktop, below it on phones |
| Completion states, progress bars and status badges | ✅ | On course cards, lesson cards and the Progress page |
| Polished, intuitive, mobile friendly | ✅ | One design system for every screen |

### Technical expectations and deliverables

| Item | Where |
| --- | --- |
| React with TypeScript; Node.js with TypeScript; database persistence | `client/`, `api/`, PostgreSQL with Prisma migrations |
| Clean API design and validation; separation of concerns | Routes → controllers → services, with Zod validation ([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)) |
| Testing of critical functionality | [Test results](#test-results) below |
| Complete source code | This repository |
| README with setup and run instructions; environment guidance | [Run it](#run-it) and [Settings you may need](#settings-you-may-need) |
| Test commands and brief results | [Useful commands](#useful-commands) and [Test results](#test-results) |
| Short architecture summary with decisions and trade-offs | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |

## Useful commands

| Command              | What it does                                                    |
| -------------------- | --------------------------------------------------------------- |
| `npm test`           | Runs the server and website tests                               |
| `npm run test:e2e`   | Runs the browser tests (needs the database migrated and seeded) |
| `npm run typecheck`  | Checks the TypeScript in both projects                          |
| `npm run build`      | Builds both projects for production                             |
| `npm run db:seed`    | Fills the database with demo data (see the warning below)       |

> **Careful:** `db:seed` deletes everything in the database first (users, courses, progress) and then adds
> the demo data. Only run it on an empty or throwaway database.

## Test results

Last full run on the `dev` branch (typecheck and format check were clean too):

| Suite | Result | Covers |
| ----- | ------ | ------ |
| Server (Vitest) | 12 files, **83 tests passed** | sign-up and sign-in, token security and sign-out, password-guess lockout, roles and access, input validation, courses, lessons and categories, enrollment, progress and completion rules, dashboards, settings, uploads |
| Website (Vitest) | 31 files, **143 tests passed** | API client and services, session and route guards, video players (resume, progress, completion, seek), upload and YouTube fields, forms, pages, UI parts |
| Browser (Playwright) | **28 tests passed** | sign up, enroll, finish a lesson and see it on the Progress page; learner blocked from admin; admin sees learner progress; settings and profile; YouTube lessons; My learning; course activity; an automated accessibility scan (axe, WCAG 2.1 A and AA) of every main screen on a desktop and a phone |

## Settings you may need

The server reads `api/.env` (a template with every option is in `api/.env.example`). The ones that matter:

| Name           | What it is                                                                  |
| -------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL` | Where the database is                                                       |
| `JWT_SECRET`   | A secret of 32+ characters used to sign people in. The server will not start without it. |
| `CLOUDINARY_*` | Optional. Turns on uploading videos and images. Links and YouTube work without it.     |

If something else already uses port 4000, set `PORT` in `api/.env`, and start the website with
`API_PROXY_TARGET=http://127.0.0.1:<that port>`.

## Learn more

- [How it is built and why](docs/ARCHITECTURE.md): design decisions and where each requirement lives
- [Server details](api/README.md): endpoints, security and every setting
- [Website details](client/README.md): folders and conventions
- [Putting it on a server](DEPLOY.md)
