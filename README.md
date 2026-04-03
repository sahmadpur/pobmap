# Baku Port Interactive Corridor Map

A Next.js application for presenting strategic transport corridors connected to Baku Port, with a built-in admin CMS for managing routes, segments, markers, and multilingual content.

## Overview

This project started as a presentation-focused interactive map and has since grown into a lightweight content-managed corridor platform.

Current scope includes:

- Public interactive corridor map
- Multilingual UI (`az`, `en`, `ru`)
- Route, segment, and marker management in an admin panel
- File-backed storage for quick local use
- Prisma-ready data model for future PostgreSQL-backed hosting
- Presentation-accurate route rendering using segment display paths

## Key Features

### Public Map

- Interactive corridor visualization centered on Baku Port
- Filters for corridor visibility, transport mode, and status
- Light and dark theme support
- Clickable route segments with side-panel details
- Transport-mode coloring for rail, ship, and road
- Font Awesome Free marker icons
- Marker popups with connected corridor shortcuts
- Baku Port popup acting as the main corridor hub

### Admin CMS

- Admin login with env-configured credentials
- Route CRUD
- Segment editing with stop-based waypoint selection
- Marker CRUD
- Searchable country picker with flags
- Searchable connected-corridor selector based on existing routes
- Searchable Font Awesome Free icon picker for markers
- Collapsible list and editor sections for easier editing

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Leaflet / React Leaflet
- i18next / react-i18next
- Prisma
- Zod
- JOSE

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and adjust values if needed.

Example local env:

```env
JWT_SECRET="replace-with-your-own-secret"
ADMIN_EMAIL="admin@bakuport.local"
ADMIN_PASSWORD="change-me-admin"
ADMIN_STORAGE_PROVIDER="file"
```

### 3. Start development

```bash
npm run dev
```

Open:

- Public map: [http://localhost:3000](http://localhost:3000)
- Admin login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

If you change `.env`, restart the dev server so new server-side values are picked up.

## Available Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm run prisma:generate
npm run prisma:push
```

## Admin Authentication

The admin login uses:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

These are read in [`src/lib/server/auth.ts`](/Users/sahmadpur/Desktop/Map%20Codex/baku-port-map/src/lib/server/auth.ts).

Important notes:

- The login page shows the credentials currently loaded by the server
- Short passwords are allowed if you intentionally set one in `.env`
- Restart the app after changing admin env values

## Storage Modes

### File Mode

Default mode for local development:

- `ADMIN_STORAGE_PROVIDER="file"`
- Data stored in [`src/data/admin-store.json`](/Users/sahmadpur/Desktop/Map%20Codex/baku-port-map/src/data/admin-store.json)

This is the fastest way to iterate locally.

### Prisma Mode

Optional mode for real hosted persistence:

- `ADMIN_STORAGE_PROVIDER="prisma"`
- `DATABASE_URL` must be configured

Relevant files:

- [`prisma/schema.prisma`](/Users/sahmadpur/Desktop/Map%20Codex/baku-port-map/prisma/schema.prisma)
- [`prisma.config.ts`](/Users/sahmadpur/Desktop/Map%20Codex/baku-port-map/prisma.config.ts)

## Deployment Notes

### Vercel

The project builds on Vercel, but there is one important limitation:

- File-backed storage is not suitable for production editing on Vercel because the filesystem is ephemeral

For hosted admin editing, use:

- `ADMIN_STORAGE_PROVIDER=prisma`
- a real `DATABASE_URL`

## Project Structure

```text
src/app
  page.tsx                    Public homepage
  admin/                      Admin routes
  api/admin/                  Admin API routes

src/components/map
  interactive-map-app.tsx     Main public map UI and filters
  interactive-map-shell.tsx   Client-only shell for hydration safety
  corridor-map-canvas.tsx     Leaflet rendering and marker behavior
  route-details-panel.tsx     Route details side panel

src/components/admin
  admin-console.tsx           Admin editor UI
  login-form.tsx              Admin login form

src/data
  corridors.ts                Seed routes and map config
  seed-markers.ts             Seed marker layer
  transport-stops.ts          Global logistics stop catalog
  countries.ts                Full country metadata
  marker-icons.ts             Font Awesome icon registry
  admin-store.json            File-mode content storage

src/lib/server
  admin-store.ts              Storage abstraction and seed merging
  auth.ts                     Admin auth and session handling
  admin-schemas.ts            Zod validation
```

## Current Data Shape

As of the current implementation:

- 8 routes in the working store
- 18 markers in the working store
- seeded ports, inland terminals, freight hubs, and corridor handoff points

## Product Notes

- The public map is optimized for presentation clarity, not strict routing simulation
- Segment `displayCoordinates` are used to make sea, rail, and road paths look visually correct
- The Baku Port popup intentionally behaves as the main corridor showcase hub

## Verification

Before pushing changes, the project is typically validated with:

```bash
npm run lint
npm run build
```

## Roadmap Gaps

The app already includes a strong Phase 1 plus a practical admin foundation, but some larger product goals are still not implemented:

- media management
- translation management screens
- richer settings screens
- robust production PostgreSQL workflow
- Electron / offline kiosk mode
- MBTiles / SQLite offline map packaging

## License

Private project for ongoing product development.
