# Agents Guide

## Quick start

```bash
npm install          # install dependencies
cp .env.example .env.local  # configure Supabase env vars
npm run dev          # start Astro dev server
npm run build        # production build → dist/
npm start            # run production server
npm test             # Vitest single run
npm run test:watch   # Vitest watch mode
```

**No `lint` or `format` scripts exist** in package.json, even though ESLint (`.eslintrc.json`) and Prettier (`.prettierrc`) configs are present. Run them manually if needed: `npx eslint src/` or `npx prettier --check src/`.

## Architecture

- **Astro 5.x SSR** + **React 19 islands** — not a React SPA. Astro owns routing/layouts/SSR; React powers interactive widgets via `client:load`.
- **Supabase** is the full backend (PostgreSQL, Auth, Storage). See `src/lib/supabase.ts` (client) and `src/lib/supabase-server.ts` (admin).
- Single-package project. No monorepo, no workspaces.
- Path alias: `@/*` → `src/*` (defined in `tsconfig.json`).
- Deployed to Vercel via `@astrojs/vercel` adapter. `output: 'server'` in `astro.config.mjs`.
- `vercel.json` rewrites all `/api/*` requests to `/_render`.

## Code conventions

- **All UI text is Chinese (Simplified).** Preserve this in new features.
- **Types are hand-maintained** in `src/types/index.ts` and `src/types/database.ts` — NOT auto-generated.
- **Tests are co-located** with source files: `src/lib/*.test.ts` (Vitest + jsdom).
- React components export **named functions**, not default exports.
- API routes use manual `new Response(JSON.stringify(...))` — no shared response helpers.
- Auth pattern: client extracts token from Supabase localStorage → passes as `Authorization: Bearer` header.
- Styling: Tailwind CSS 3.x with shadcn/ui-style HSL CSS variables defined in `src/styles/global.css`.

## Gotchas

- **Quiz update strategy**: Questions are deleted and reinserted on every save — not incrementally patched.
- **Polymorphic `correct_answer`**: `string` for single_choice/true_false/short_answer; `string[]` for multiple_choice/fill_blank.
- **Login page inconsistency**: `src/pages/auth/login.astro` uses vanilla JS with a hardcoded Supabase client, unlike the rest of the app which uses `src/lib/supabase.ts`.
- **`zustand` is unused**: It's in `package.json` dependencies but no code imports it.
- **Database types**: `src/types/database.ts` must be updated manually when the Supabase schema changes. Migrations live in `supabase/migrations/`.
- **Env vars required**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (see `.env.example`).

## Reference docs

- `ARCHITECTURE.md` — comprehensive design docs (data models, component inventory, API endpoints, RLS policies)
- `README.md` — features, tech stack, quick start, API reference
- `setup.md` — environment setup guide
