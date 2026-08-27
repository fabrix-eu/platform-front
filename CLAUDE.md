# CLAUDE.md — platform-front

SPA frontend for Fabrix. Built with Vite + TanStack Router + React Query. This is the active frontend — all frontend work happens here.

## Commands

```bash
npm run dev          # Vite dev server on http://localhost:4002
npm run typecheck    # tsc -b (must pass before commit)
npm run build:test   # Build with localhost:4011 API (for feature specs)
npm run build:prod   # Build with production API (for deploy only)
npm run lint         # ESLint
```

No tests yet. The typecheck (`tsc -b`) is strict: unused locals/parameters are errors.

## Architecture

### Philosophy: thin client

The frontend holds **no business logic**. It is a thin rendering layer over the API:

- **Data fetching**: React Query (`useQuery`) — the query cache IS the app state
- **Mutations**: `useMutation` → API call → `invalidateQueries` to refresh
- **Validation**: 100% server-side. No Zod/yup schemas. Submit the form, display server errors via `FieldError` component
- **Auth**: JWT tokens in localStorage, auto-refresh on 401 (see `src/lib/api.ts`)

### Navigation (flat, single level)

One sidebar (`AppSidebar`), a flat list with one icon per entry:

```
Global:   Home (/ → org dashboard), Marketplace (/marketplace), Events (/events), Directory (/global)
Org:      Profile (/$orgSlug/profile), Compass (/$orgSlug/assessments), Connections (/$orgSlug/relations),
          Members (/$orgSlug/settings/members), Messages (/$orgSlug/messages)
Facilitator (role facilitator / network member): Dashboard (/facilitator), My Network (/facilitator/network)
Personal: Notifications (/notifications), Settings (/settings)
```

Communities and challenges were retired: their routes/pages/libs are gone; `/communities*` redirects to `/global`. Events are first-class global (RSVP via `/events/:id/participants`, `country_code` on the event).

### Explore pages (Marketplace, Events, Directory)

The three explore pages share one framework:

- `src/components/explore/ExploreShell.tsx` — filter sidebar + header (result count, action, cards|list|map `ViewModeToggle` driven by the `view` search param) + infinite scroll (`InfiniteScrollSentinel`)
- `src/components/explore/ExploreFilters.tsx` — sidebar sections: text search, Location ("Near" + radius + country), listing-type taxonomy (hidden for Events)
- `src/components/explore/PointsMap.tsx` — generic MapLibre map (`MapPoint[]`, filter circle, legend overlay); `OrganizationsMap` is a thin Organization wrapper over it
- `src/lib/explore.ts` — `resolveLocation`/`useMyOrgLocation`: the location filter **defaults to "Me"** (current org address from `/me`, radius 100 km); `near=all` in the URL means cleared; explicit `lon/lat` means a chosen place
- Map data comes from the non-paginated `view=map` API mode on all three endpoints

### Route guards

Defined in `src/lib/router.ts`, used in `beforeLoad`:

- `requireAuth()` — redirects to `/login` if not authenticated
- `requireOrgMember({ params })` — checks user belongs to `orgSlug`, else redirects to public profile

Guards read from the React Query cache (`queryClient.getQueryData(['me'])`).

### OrgSwitcher context-awareness

The OrgSwitcher computes the destination based on current context:
- Outside an org shell → `/$newSlug/dashboard`
- Inside (`/$orgSlug/...`) → `/$newSlug/...` (preserves section)

## File structure

```
src/
├── main.tsx                    Entry point (QueryClient + Router providers)
├── index.css                   Tailwind v4 theme (@theme inline)
├── lib/
│   ├── api.ts                  Fetch wrapper, JWT auth, auto token refresh
│   ├── auth.ts                 Login/logout/getMe, User types
│   ├── organizations.ts        Org API functions + types + ORG_KINDS
│   ├── router.ts               All route definitions + guards
│   └── queryClient.ts          React Query client (staleTime: 60s)
├── components/
│   ├── OrgSwitcher.tsx         Context-aware org dropdown
│   ├── UserMenu.tsx            Avatar dropdown (Radix Avatar)
│   ├── OrganizationsMap.tsx    MapLibre GL map
│   ├── MapLegend.tsx           Map filter/legend
│   ├── OrganizationForm.tsx    Reusable create/edit form
│   ├── FieldError.tsx          Server validation error display
│   └── ui/
│       └── avatar.tsx          Radix Avatar wrapper (shadcn pattern)
└── routes/
    ├── root.tsx                Header layout (Shell A nav or clean)
    ├── home.tsx                Org cards or onboarding CTA
    ├── login.tsx               Login form
    ├── map.tsx                 Map page
    ├── organizations/          Shell A org pages
    │   ├── list.tsx            Directory with search + pagination
    │   ├── show.tsx            Public org profile
    │   ├── new.tsx             3-step: search → claim → create
    │   └── edit.tsx            Edit org form
    ├── org/                    Shell B pages
    │   ├── layout.tsx          Sidebar layout
    │   ├── dashboard.tsx       Stats cards
    │   ├── profile.tsx         Org info
    │   ├── relations.tsx       Relations (stub)
    │   ├── assessments.tsx     Assessments (stub)
    │   └── settings.tsx        Org settings (members & invitations)
    ├── events/                 Global events (list, show, new, edit)
    └── marketplace/            Marketplace (list, show, new, edit)
```

## Conventions

### Adding a new API resource

1. Create `src/lib/<resource>.ts` with types matching backend Blueprint fields exactly
2. Export API functions: `getResources()`, `getResource(id)`, `createResource(data)`, etc.
3. Use `api.get<T>()`, `api.post<T>()` from `src/lib/api.ts`
4. Types use snake_case (matching the API), not camelCase

### Adding a new route

1. Define the route in `src/lib/router.ts` using `createRoute()`
2. Add it to the route tree
3. Create the page component in `src/routes/`
4. Add `beforeLoad` guard if the route requires auth

### URL-driven state (critical rule)

**Never use React `useState` for page-level UI state that should be shareable or bookmarkable.** Use TanStack Router search params (`validateSearch` + `useSearch`) instead.

Examples of state that MUST be in the URL:
- Active tab/section on a page (`?section=services`)
- Selected item in a list (`?selected=<id>`)
- Filters and search terms (`?search=...&by_type=...`)
- Modal/panel open state when it represents a distinct view

Use `validateSearch` with Zod on the route definition, then read with `useSearch()` and write with `navigate({ search: ... })`.

```tsx
// Route definition
const myRoute = createRoute({
  validateSearch: z.object({
    section: z.enum(['info', 'settings']).optional(),
  }),
});

// In component — read from URL, navigate to update
const { section } = useSearch({ strict: false });
const activeSection = section || 'info';

const setSection = (id: string) => {
  navigate({ to: '/my-page', search: { section: id } });
};
```

### Forms and validation

No client-side validation. The server is the source of truth. Submit the form, display server errors via `FieldError`.

**Shared form components**: Never duplicate form fields between create and edit pages. Extract a shared `<ResourceForm>` component that receives the mutation and an `onSubmit` callback. The create and edit pages handle routing, data loading, and mutation setup — the form component handles the fields.

```tsx
// components/ResourceForm.tsx — shared fields
function ResourceForm({ mutation, onSubmit, onCancel, initialName, ... }) { ... }

// routes/resources/new.tsx — create page
const mutation = useCreateResource();
<ResourceForm mutation={mutation} onSubmit={(data) => mutation.mutate(data)} ... />

// routes/resources/edit.tsx — edit page
const mutation = useUpdateResource();
<ResourceForm mutation={mutation} initialName={resource.name} onSubmit={(data) => mutation.mutate({ id, payload: data })} ... />
```

### Query keys

| Key | Data |
|-----|------|
| `['me']` | Current user + orgs + communities |
| `['organizations']` | Paginated list |
| `['organizations', id]` | Single org |
| `['organizations', 'map']` | All orgs for map |

### Styling

- **Tailwind CSS v4** — config is in `src/index.css` via `@theme inline`
- **Fonts**: Archia (display/headings), IBM Plex Sans (body)
- **Colors**: primary = purple (`hsl(262.1 83.3% 57.8%)`), see `@theme` block
- **UI components**: Radix primitives added as needed (not full shadcn). Wrappers go in `src/components/ui/`
- **Org kind badges**: use `ORG_KINDS[kind].color` from `src/lib/organizations.ts`

### API client (`src/lib/api.ts`)

- Base URL: `http://localhost:4001` (dev) / `https://api.fabrixproject.eu` (prod)
- Auto-unwraps `{ data: ... }` envelope
- On 401: tries `POST /auth_tokens/refresh`, retries original request. If refresh fails: clears tokens, redirects to `/login`
- Concurrent refresh calls are deduplicated

## Environment

```
Dev:  http://localhost:4002 (frontend) → http://localhost:4001 (backend)
Prod: GitHub Pages (static SPA) → https://api.fabrixproject.eu
```

No `.env` files. Uses `import.meta.env.PROD` to switch API base URL.
