# Baku Port Interactive Map

Interactive transport corridor map plus a Phase 2 admin CMS foundation.

## Run

```bash
npm install
npm run dev
```

Open:

- Public map: [http://localhost:3000](http://localhost:3000)
- Admin login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Admin Defaults

Copy `.env.example` to `.env` if you want to override defaults.

Default local admin credentials:

- Email: `admin@bakuport.local`
- Password: `change-me-admin`

## Storage Modes

- Default: file-backed fallback store in `src/data/admin-store.json`
- Optional Prisma/PostgreSQL mode: set `ADMIN_STORAGE_PROVIDER="prisma"` and configure `DATABASE_URL`

## Prisma

```bash
npm run prisma:generate
npm run prisma:push
```

The Prisma schema is in `prisma/schema.prisma`, with runtime config in `prisma.config.ts`.
