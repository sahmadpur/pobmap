# Project Memory

This file is a working continuation note for future chats and implementation passes.

## Project Identity

- Project: `baku-port-map`
- Repo: [https://github.com/sahmadpur/pobmap](https://github.com/sahmadpur/pobmap)
- Branch: `main`
- Framework: Next.js App Router

## What The Product Is

A presentation-focused interactive transport corridor map for Baku Port, with a built-in admin CMS for managing:

- routes
- route segments
- markers
- multilingual content

The public map is intended to look strong in demos and stakeholder presentations, not to behave like a strict GIS routing engine.

## Current Major Capabilities

### Public map

- Interactive corridor map on `/`
- Light and dark theme
- Language switching: `az`, `en`, `ru`
- Corridor, status, and transport mode filtering
- Clickable segments
- Route details panel
- Presentation-oriented route rendering with `displayCoordinates`
- Live routes loaded from admin store
- Live markers loaded from admin store
- Baku Port popup shows the full corridor catalog
- Additional markers show connected routes from geometry/manual links

### Admin CMS

- Login at `/admin/login`
- Route CRUD
- Segment editing via stop selection instead of raw coordinate JSON
- Marker CRUD
- Countries selector with search and flags
- Connected corridors selector based on existing routes
- Font Awesome Free searchable icon picker
- Collapsible route/marker lists
- Collapsible route/marker editors
- Segment cards are collapsible too

## Important Architecture Decisions

### Storage

The app supports two modes:

1. `file`
   Uses `src/data/admin-store.json`

2. `prisma`
   Intended for PostgreSQL-backed hosting

For local work, `file` mode is currently the main path.

### Route Geometry Model

Each segment can have:

- `coordinates`
  Logical stop-derived geometry

- `displayCoordinates`
  Presentation path for rendering

This is important because ship segments and long corridors are shaped for visual quality rather than raw straight-line geometry.

### Marker Model

Markers are stored in admin data and rendered live on the public map.

Special handling exists for the primary Baku Port marker:

- it is always shown
- it uses saved data when present
- it falls back to seed data if needed
- its popup intentionally lists all routes in the catalog

### Seed Markers

The project now uses shared seeded marker data in:

- `src/data/seed-markers.ts`

This file populates the map with ports, terminals, and logistics hubs so the map does not look empty.

The file-backed store merges seed markers with any existing saved markers instead of replacing them.

## Current Content State

At the time this memory file was written:

- 8 routes in the working file store
- 18 markers in the working file store

Notable seeded marker coverage includes:

- Baku Port
- Xi'an Inland Port
- Almaty Logistics Hub
- Aktau Seaport
- Tbilisi Intermodal Hub
- Kars Logistics Terminal
- Istanbul Gateway
- Moscow Freight Hub
- Vladivostok Port
- Bandar Abbas Port
- Tehran Logistics Hub
- Karachi Gateway
- Nakhchivan Corridor Terminal
- Faw Grand Port
- Baghdad Cargo Terminal
- Amman Freight Hub
- Damascus Terminal

## Important Files

### Public map

- `src/app/page.tsx`
- `src/components/map/interactive-map-shell.tsx`
- `src/components/map/interactive-map-app.tsx`
- `src/components/map/corridor-map-canvas.tsx`
- `src/components/map/route-details-panel.tsx`

### Admin CMS

- `src/app/admin/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/components/admin/admin-console.tsx`
- `src/components/admin/login-form.tsx`

### Data and config

- `src/data/corridors.ts`
- `src/data/transport-stops.ts`
- `src/data/countries.ts`
- `src/data/marker-icons.ts`
- `src/data/seed-markers.ts`
- `src/data/admin-store.json`

### Server and persistence

- `src/lib/server/admin-store.ts`
- `src/lib/server/auth.ts`
- `src/lib/server/admin-schemas.ts`
- `prisma/schema.prisma`
- `prisma.config.ts`

## Authentication Notes

Admin credentials are env-driven:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Relevant file:

- `src/lib/server/auth.ts`

Important detail:

- login validation was adjusted to allow short passwords from env values

If login stops reflecting changed env credentials, restart the dev server.

## Deployment Notes

### Vercel

Builds are working.

Important caveat:

- file-backed storage is not suitable for production editing on Vercel because the filesystem is ephemeral

Recommended hosted path:

- `ADMIN_STORAGE_PROVIDER=prisma`
- real `DATABASE_URL`

## UX Decisions Already Made

- Roboto is used throughout the app
- Light mode is the default theme
- The homepage map is wrapped in a client-only shell to reduce hydration issues
- The Baku Port popup is a corridor showcase entry point, not just a literal physical-stop popup
- Admin editing prioritizes human-friendly selectors over raw JSON

## Known Gaps / Future Work

Still open for future phases:

- richer settings management
- media upload and media library
- translation management UI
- better production PostgreSQL workflows and seed scripts
- offline / kiosk / Electron packaging
- finer marker density control by zoom level
- admin editing for manual `displayCoordinates`

## Suggested Next Steps

Good next candidates for a new session:

1. Add zoom-aware marker clustering or density rules
2. Add dedicated editing for presentation paths
3. Improve marker popup design and content richness
4. Finish the Prisma/PostgreSQL production path
5. Remove visible credential display from the admin login page for safer demos

## Validation Habit

Common verification commands:

```bash
npm run lint
npm run build
```

These have been used repeatedly throughout development and should remain the default sanity check before commits.
