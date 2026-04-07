# CLAUDE.md

## Project Overview

**Simmer** (JFAT Cookbook) is a social recipe platform built with Next.js 16, React 19, and PostgreSQL via Prisma. Users create native recipes or import linked recipes from URLs (with AI-powered extraction via Google Gemini). Social features include friend requests, partnerships (duo mode), activity feeds, and recipe saving.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL with Prisma 7 ORM
- **Styling**: Tailwind CSS 4
- **Auth**: Session-based with HTTP-only cookies (bcryptjs)
- **AI**: Google Gemini 2.5-flash (`@google/genai`)
- **HTML Parsing**: Mozilla Readability + linkedom

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:migrate   # Create/apply Prisma migrations
npm run db:seed      # Seed database (npx tsx prisma/seed.ts)
npm run db:reset     # Reset database to clean state
```

`postinstall` automatically runs `prisma generate`.

## Project Structure

```
src/
  app/                  # Next.js App Router pages & API routes
    api/                # REST endpoints (auth, recipes, friends, feed, etc.)
    recipes/            # Recipe pages (new, edit, detail)
    friends/            # Friends page
    feed/               # Activity feed page
    login/ signup/      # Auth pages
  components/           # React client components ("use client")
  hooks/                # Custom hooks (feed polling, wake lock)
  lib/                  # Server utilities (auth, AI, Prisma, extraction)
  types/                # TypeScript interfaces
  generated/            # Prisma generated client (gitignored)
prisma/
  schema.prisma         # Database schema (9 models)
  migrations/           # Migration history
  seed.ts               # Seed script
middleware.ts           # Auth middleware for protected routes
```

## Architecture & Conventions

### Data Flow
- **Pages** use React Server Components with `force-dynamic` for data fetching
- **Components** are client-side (`"use client"`) for interactivity
- **API routes** handle mutations via `src/app/api/`
- **Client-side filtering** uses `useMemo` for performance (e.g., RecipeLibrary)

### Authentication
- Session-based: UUID token stored in `auth-token` HTTP-only cookie (7-day expiry)
- `getCurrentUser()` in `src/lib/auth.ts` validates sessions server-side
- Middleware protects: `/recipes/new`, `/recipes/:id/edit`, `/feed`, `/friends`
- Password hashing: bcryptjs with 12 salt rounds

### Recipe Types
- **Linked**: Imported from URLs with AI-powered extraction
- **Native**: Manually created by users
- Array fields (ingredients, steps, tags) stored as JSON strings in the database

### AI Extraction Strategy (multi-tier fallback)
1. Server-side fetch + structured data extraction (JSON-LD)
2. Gemini with `urlContext` for blocked sites
3. Gemini with `googleSearch` by recipe name
4. Gemini with extracted text content

### Database Patterns
- IDs use `cuid()` (not UUID)
- All relationships use `onDelete: Cascade` (except FeedEvent -> Recipe which uses `SetNull`)
- Status fields are strings with documented valid values in comments
- Path alias: `@/*` maps to `./src/*`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Google Generative AI API key |
| `NODE_ENV` | Controls secure cookie flags |

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Session management & password utilities |
| `src/lib/ai.ts` | Gemini integration for recipe extraction |
| `src/lib/extract.ts` | HTML parsing & structured data extraction |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/constants.ts` | Enum/select options (seasons, cuisines, etc.) |
| `src/components/recipe-library.tsx` | Main recipe browsing interface |
| `middleware.ts` | Route protection middleware |
| `prisma/schema.prisma` | Database schema definition |

## Development Notes

- No test framework is configured yet
- No CI/CD pipeline — no GitHub Actions
- ESLint 9 flat config with Next.js Core Web Vitals + TypeScript rules
- Prisma client output goes to `src/generated/prisma` (gitignored)
- After schema changes: run `npm run db:migrate` then the client regenerates automatically
