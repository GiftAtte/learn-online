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

You need [Node.js](https://nodejs.org) 22 or newer and [Docker](https://www.docker.com) (for the database).

```bash
npm run setup                    # install everything
cp api/.env.example api/.env     # then open api/.env and set JWT_SECRET to any 32+ characters
npm run db:up                    # start the database
npm run db:migrate               # create the tables
npm run db:seed                  # add demo courses and two demo accounts
npm run dev:api                  # the server: http://localhost:4000   (keep this terminal open)
npm run dev:client               # the website: http://localhost:5173  (use a second terminal)
```

Open <http://localhost:5173> and sign in with a demo account:

| Role          | Email                     | Password      |
| ------------- | ------------------------- | ------------- |
| Administrator | `admin@learnonline.dev`   | `Admin123!`   |
| Learner       | `learner@learnonline.dev` | `Learner123!` |

These accounts are for your own computer only. Never use them on a public site.

**Prefer Docker for everything?** Run `docker compose up --build`, then
`docker compose exec api npm run db:seed`, and open <http://localhost:8080>.

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
| Website (Vitest) | 29 files, **136 tests passed** | API client and services, session and route guards, video players (resume, progress, completion, seek), upload and YouTube fields, forms, pages, UI parts |
| Browser (Playwright) | **22 tests passed** | sign up, enroll, finish a lesson and see it on the dashboard; learner blocked from admin; admin sees learner progress; settings and profile; YouTube lessons; My learning; course activity |

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
