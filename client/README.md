# LearnOnline client

React 19 + TypeScript, Vite, Tailwind CSS 4, Radix UI primitives with our own styling.

## Setup

```bash
cd client
npm install
npm run dev        # http://localhost:5173  (proxies /api to http://localhost:4000)
```

Start the API first (see `../api/README.md`). To call an API on another origin set `VITE_API_URL` (see `.env.example`).

Scripts: `dev` · `build` · `preview` · `typecheck` · `test` · `format` · `format:check`

## Folder structure

```
src/
  core/                      the application core: everything that is not UI
    api/                     fetch wrapper (client.ts: envelope, cookies, 401 handling) and ApiError
    services/                API calls only, no React: one file per module (auth, categories, courses,
                             lessons, progress, enrollments, dashboard, users). Names follow the operation:
                             getAll<Things>, get<Thing>ById, create<Thing>, update<Thing>, delete<Thing>
                             (getAllCategories, getCourseById, createLesson ...). Hooks mirror them with a
                             use prefix (useGetAllCategories, useCreateLesson ...).
    hooks/
      queries/               every TanStack Query hook, one file per module (use-courses.ts, use-lessons.ts,
                             use-progress.ts ...); they call services and own caching, invalidation, toasts.
                             Also query-keys.ts and invalidate.ts.
      ui/                    generic hooks: debounced search, URL params, edit target
    schemas/                 Zod form schemas shared with the API's rules
    lib/                     notify, messages, forms, format, cn, table, query client
    types/                   every shared type, one file per module: api, user, auth, category, course,
                             lesson, progress, dashboard, learner (response shapes, inputs, filters).
                             Services, hooks and pages import types from here and never declare their own.
  components/                everything reusable on screen
    ui/                      primitives: Button, Input, Select, Badge, Card, Modal, FormModal, Tabs, ProgressBar...
    feedback/                Toaster, Alert, EmptyState, ErrorState, ConfirmDialog (useConfirm), PageLoader
    layout/                  RootLayout picks the frame: PublicLayout (header + footer shared with the landing page) for signed-out visitors,
                             AppShell (sidebar, top bar, mobile tab bar) for signed-in people; PageHeader, Container, Logo
    data-display/            DataTable (cards on phones), Pagination, SearchInput, FilterChips, StatTile
    media/                   VideoPlayer
    courses/ lessons/ dashboard/ categories/ admin/
                             building blocks for one domain (CourseCard, LessonPlayerCard, ContinueCard...)
  router/                    paths.ts (every URL, written once), router.tsx (the sitemap: page + who may open it), guards/ -
                             RequireAuth, RequireAdmin, GuestOnly (they render React, so they live here, not in core)
  pages/                     route-level screens (thin: compose components and hooks), grouped by audience:
                             landing-page.tsx (the home page), browse/ (catalog and course: the same screens for visitors and signed-in people), learner/ (lesson, my learning, dashboard), admin/, auth/; plus
                             app-providers.tsx: the wrapper around every page (query client, confirm dialog, toasts, 401 handling)
  styles/                    globals.css = design tokens + base styles
  test/                      every unit test, mirroring the folders above (test/core/..., test/components/...),
                             plus setup.ts
```

Data flows one way: **page → hook (`core/hooks/queries`) → service (`core/services`) → `core/api/client`**.
Services know about URLs and payloads but not React; hooks know about caching and feedback but not URLs.
Components in `ui`, `feedback`, `layout`, `data-display` and `media` know nothing about courses or lessons; the
domain folders do. Pages only compose.

## How pages are built

Every page is a short composition of shared blocks, so all screens look and behave the same:

```tsx
export default function AdminCategoriesPage() {
  const categories = useGetAllCategories(); // data comes from a query hook
  const editor = useEditTarget<Category>(); // open/close state for the form modal

  return (
    <Page
      title="Categories"
      description="..."
      actions={<Button onClick={editor.openNew}>New</Button>}
    >
      <QueryBoundary query={categories} loading={<TableSkeleton />}>
        {(items) => <DataTable columns={columns} data={items} getRowId={(r) => r.id} />}
      </QueryBoundary>
      {editor.isOpen && <CategoryFormModal existing={editor.item} onClose={editor.close} />}
    </Page>
  );
}
```

| Block                                                                   | Job                                                                                                                  |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `<Page>`                                                                | The one layout: back link, title, description, actions, then evenly spaced blocks. Never add your own outer padding. |
| `<Section>`                                                             | A titled block inside a page.                                                                                        |
| `<QueryBoundary>`                                                       | Decides loading / error (with "Try again") / empty / content, so pages never repeat that branching.                  |
| `<DataTable>` + `TitleCell`, `ProgressCell`, `NumberCell`, `RowActions` | Every list. Becomes cards on phones.                                                                                 |
| `useEditTarget()` + `<FormModal>`                                       | Simple create / edit in a modal.                                                                                     |
| `useUrlParams()`                                                        | Search, filters and page number in the URL.                                                                          |

Each page file starts with a comment saying its route and who can open it. Big pieces of a page live in
`components/<domain>/` (for example `LessonPlayerCard`, `CourseSummaryCard`) so page files stay short.

URLs are grouped by audience. `router/paths.ts` lists every address once (`PATHS`; `link(PATHS.learner.lesson, { lessonId })` fills in an id). `router/router.tsx` is the sitemap: one line per page saying its address, the page, and who may open it (`everyone`, `guest`, `signedIn` or `admin`). The guards in `router/guards/` enforce that column.

| URL                                                                            | Who            | Page                                                                              |
| ------------------------------------------------------------------------------ | -------------- | --------------------------------------------------------------------------------- |
| `/`                                                                            | everyone       | landing page (about LearnOnline)                                                  |
| `/catalog`, `/courses/:id`                                                     | visitors       | free catalog and course detail; signed-in people are redirected to `/learner/...` |
| `/learner/catalog`, `/learner/courses/:id`                                     | signed-in      | the same two screens inside the app (sidebar)                                     |
| `/learner/lessons/:id`, `/learner/my-learning`, `/learner/dashboard`           | signed-in      | lesson player, my learning, progress                                              |
| `/sign-in`, `/sign-up`                                                         | guests         | authentication                                                                    |
| `/admin`, `/admin/courses[/:id]`, `/admin/categories`, `/admin/learners[/:id]` | administrators | management                                                                        |

Pages load on demand (code splitting). In development, `/styleguide` shows every component and state.

## State management

| State                         | Tool                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Server data                   | TanStack Query (`core/hooks/queries`), fetching through `core/services/`                                                                         |
| Signed-in session             | The token is an httpOnly cookie (invisible to our code); `GET /auth/me` says who is signed in and TanStack Query keeps the answer (`useSession`) |
| Filters, search, page         | URL search params                                                                                                                                |
| Forms                         | React Hook Form + Zod                                                                                                                            |
| Notifications / confirmations | `notify` service, `useConfirm()`                                                                                                                 |
| Everything else               | local `useState`                                                                                                                                 |

## Design system

Tokens live in `src/styles/globals.css` (`@theme`). The identity is "chalkboard and pencil":
spruce green is the brand; **pencil yellow means progress and "you are here"** and is used nowhere else.
Corner radius follows hierarchy (controls 8px, cards 14px, video stage 22px), shadows are tinted with the brand colour, headings use Bricolage Grotesque and the interface uses Instrument Sans.
Navigation follows the screen and the person: signed-in learners and administrators get a left **sidebar** on desktop
(the pencil bar marks the current page; administrators get their management links plus "View catalog"), a slim top bar
with an account menu on tablets, and a **bottom tab bar** on phones. Signed-out visitors get a simple top bar with
Sign in / Sign up. Signed-out visitors see `public-header.tsx` and `public-footer.tsx` (the same as the landing page); signed-in people see `app-shell.tsx` and `sidebar.tsx`. The links per role are in `components/layout/root-layout.tsx`.

Open `/styleguide` (development only) to see every component and state.

## Feedback conventions

- All wording lives in `core/lib/messages.ts`. Sentence case, active voice, an action keeps its name end to end ("Publish" gives "Course published"), errors say what to do next.
- **Transient result of an action** (saved, deleted, failed) → `notify.success / info / warning / apiError`. Never import `toast` directly.
- **Failed mutations** already show one standard error toast (`core/lib/query-client.ts`); screens only handle success. Opt out with `meta: { handlesOwnError: true }` when showing field errors instead (`applyServerErrors` in `core/lib/forms.ts`).
- **Information that must stay on screen** → `<Alert>`. **Empty list** → `<EmptyState>`. **Failed load** → `<ErrorState onRetry>`. **Loading** → skeletons that mirror the final layout.
- **Destructive actions** → `await confirm(MESSAGES.confirm.deleteX)`.
- **Simple create / edit** (categories, lessons, basic course details) → `<FormModal>`, not a separate page.

## Accessibility and responsiveness

Mobile first: single column on phones with a bottom tab bar, tables become labelled cards, dialogs become bottom sheets.
Radix primitives provide focus trapping, keyboard support and ARIA; every control has a visible focus ring, form errors are announced and linked to their field, and motion respects `prefers-reduced-motion`.

## Tests

`npm test` (Vitest + Testing Library, **62 tests**): API client (envelope, errors, 401 handling), services (URLs, verbs, query strings), session and sign-out (server-side token revocation), route guards (guest / learner / admin), the video player (resume, progress reporting, completion, seek, speed, error recovery), enroll and course actions, notifications, formatting helpers, form-field accessibility wiring, buttons, progress bar, confirm dialog.

Browser tests live in `../e2e` (Playwright).

## Notes

- Demo videos from the seed are 10-second public clips. The player resumes from the saved position and reports progress every 10 seconds, on pause and when leaving the page.
- Pages are code-split, so the first visit only downloads the page it needs.
- Demo accounts come from the API seed (`admin@learnonline.dev` / `Admin123!`, `learner@learnonline.dev` / `Learner123!`). Change them before any real deployment.
