# How LearnOnline is built

The short version is in the [README](../README.md). This page is for people who want the reasons behind
the design and to see where each requirement lives in the code.

## Where each requirement lives

| Requirement | Where |
| --- | --- |
| Sign-up, sign-in, protected routes, learner and admin roles | `api/src/modules/auth`, `middleware/authenticate.ts`, `authorize.ts`; `client/src/router/guards`, `core/hooks/queries/use-auth.ts` |
| Secure sessions | bcrypt, HS256 JWT with pinned algorithm, role loaded from the database on every request, real sign-out (token version), rate limiting, helmet, CORS allow-list |
| Profile: change name and password | `api/src/modules/auth` (`PATCH /auth/me`, `POST /auth/change-password`); `client/src/pages/profile-page.tsx` |
| Course catalog with card layout (thumbnail, category, duration, progress; the bar is empty and the card says "Not enrolled" until the learner enrolls) | `client/src/pages/browse/catalog-page.tsx`, `components/courses/course-card.tsx` |
| Course detail with lesson cards; focused video card with next-up lessons | `pages/browse/course-page.tsx`, `pages/learner/lesson-page.tsx`, `components/lessons` |
| Video: play, pause, seek, replay, speed, resume, completion at the end | `client/src/components/media/video-player.tsx`; rules in `api/src/modules/progress` |
| YouTube lessons (by video ID) | `client/src/components/media/youtube-player.tsx`, `components/lessons/youtube-field.tsx`, `core/lib/youtube.ts` |
| Enrollment and progress tracking, learner Progress page, My learning | `modules/enrollments`, `modules/progress`, `modules/dashboard`; `pages/learner/progress-page.tsx`, `my-learning-page.tsx` |
| Admin: courses, lessons (order, metadata), categories, learners, drill-down per learner, promote to admin | `client/src/pages/admin/*`; `modules/courses`, `lessons`, `categories`, `users`. The **Lessons** page (`pages/admin/lessons-page.tsx`, `GET /lessons`) lists every lesson across all courses. |
| Admin settings: app name and logo, upload size and file types, open or closed sign-ups | `api/src/modules/settings`; `client/src/pages/admin/settings-page.tsx` |
| Loading, empty and error states; responsive (mobile first) and accessible UI | `QueryBoundary`, skeletons, `EmptyState`, `ErrorState`; one card per row on phones, mobile tab bar, tables become cards, Radix primitives, labelled controls; automated axe scan in `e2e/tests/accessibility.spec.ts` |

## Shape

A single-page React client talks to a versioned JSON API (`/api/v1`) over one response envelope
(`{ success, data, meta }` or `{ success: false, error }`). The API is layered per feature:
`routes` (URL and middleware) → `controller` (HTTP translation) → `service` (business rules, Prisma).
Input is validated with Zod at the edge; services never see unvalidated data.

## Decisions and trade-offs

- **Authorization on the server, always.** The client hides screens a person cannot use, but every rule
  is enforced by the API. Roles are never read from the token or request body: each request loads the
  user, so role changes and deleted accounts apply immediately. Sign-out (and a password change) bumps a
  per-user token version, which revokes every older token without a token blocklist.
- **Token in an httpOnly cookie.** The API sets the sign-in token as a cookie that JavaScript cannot read
  (`HttpOnly`), so an XSS bug cannot steal it. `SameSite=Strict` stops other sites from making the browser
  send it (CSRF), `Secure` keeps it to HTTPS in production, and its `Path` limits it to the API. The client
  never sees or stores the token: it sends `credentials: 'include'` and asks `GET /auth/me` who is signed in.
  The cookie is the only place the token lives; there is no `localStorage` and no `Authorization` header.
- **Guessing passwords is slowed down.** Only failed sign-in (and password-change) attempts are counted:
  after 5 wrong passwords an address is blocked for 15 minutes, then the count starts again. Both numbers
  are settings (`AUTH_MAX_FAILED_ATTEMPTS`, `AUTH_LOCKOUT_MINUTES`).
- **Progress is derived, not stored.** Only per-lesson progress (position, completed) is saved; course
  percentages and statuses are computed, so they cannot drift. Completion is sticky and fires when the
  video ends or at 95% watched; the server clamps positions to the lesson length.
- **Video URLs are access-controlled.** They are only returned to enrolled learners and admins; drafts
  are invisible to everyone else. A YouTube lesson stores a normal `youtube.com/watch?v=` address in the
  same field, and the lesson page picks YouTube's player when it sees one.
- **Uploads go straight to Cloudinary.** The API only signs the request (and decides which file types are
  allowed, from the admin settings), so large videos never pass through the server.
- **Relational integrity in the database.** Foreign keys with explicit delete behaviour (a category in
  use cannot be deleted, deleting a course cascades), unique constraints for `(user, course)` and
  `(course, lesson order)`, and upserts so concurrent progress saves cannot duplicate rows.
- **Admin aggregates are computed in memory.** Fine at this scale and easy to read; move to SQL
  `GROUP BY` for large datasets.
- **Rate limiting is per process.** Use a shared store such as Redis when running several instances.
- **Client state.** TanStack Query for server data (the signed-in user too), URL parameters for filters
  and paging, local state for everything else.
- **Design system.** Tokens in `client/src/styles/globals.css`; every page is a composition of shared
  blocks (`Page`, `Section`, `SettingsSection`, `QueryBoundary`, `DataTable`) so screens behave the same.

- **Course duration is derived.** Each lesson stores its own length; a course shows the sum of its lessons, so
  the two can never disagree. An administrator changes a course's duration by changing its lessons.
- **Mobile first, with fluid type.** Styles are written for a phone and widened with breakpoints: statistics
  cards are one per row until 768px, tables turn into cards, and the side lesson list moves below the video.
  The root font size is fluid (15px on a small phone growing to 17px on a desktop, `clamp()` in
  `styles/globals.css`), and all text, spacing and controls are in `rem`, so the whole interface scales
  together, as with Bootstrap's responsive font sizes. Buttons are also one step smaller on phones
  (`components/ui/button.tsx`). Inputs stay at 16px text so iOS does not zoom when they are focused.
- **Grouped navigation.** The admin sidebar groups its links under headings (Content, People, Learner view);
  navigation items are plain data in `components/layout/root-layout.tsx`. The phone tab bar only has room for
  four destinations, so items marked `inTabBar: false` move into the menu under the avatar.

## Tests

- `npm test` runs the server and website suites (Vitest and Testing Library).
- `npm run test:e2e` drives the real app in Chrome with Playwright. It needs the database migrated and
  seeded, starts its own server (port 4100) and website (port 5273), and uses the installed Chrome
  (`E2E_BROWSER=msedge` to change it).
- The same browser run includes an accessibility scan (axe-core, WCAG 2.1 A and AA) of every main screen as a
  visitor, learner and administrator, on a desktop and on a phone. It checks colour contrast, names for
  controls and page structure, and fails on any violation. It does not replace trying the app with a keyboard
  and a screen reader.
- Server tests use a separate `learnonline_test` database on the same Postgres; migrations are applied
  automatically and tables are cleared before each test.
- CI (`.github/workflows/ci.yml`) runs the type check, format check, tests and the website build on every push.

## Known limits

No refresh tokens; demo videos are external sample clips; no email verification or password reset;
payment details on the profile page are a design preview only; `npm audit` reports findings in the Prisma
CLI's dev-time tooling (documented in `api/README.md`).
