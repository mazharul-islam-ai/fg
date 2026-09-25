# Project Boilerplate Starter

Modern Vite + React starter for **AI Code Generation** (`sjinnovation/base`).

Path: `boilerplate/project-boilerplate-starter/`

Agents copy this first, then add product features â including **modern UI** on this design system.

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 18 + TypeScript + DM Sans |
| Styling | Tailwind tokens + soft surfaces |
| Components | Radix / shadcn + lucide |
| Data | React Query **v5** + Supabase JS **v2** |
| Forms | react-hook-form + Zod |
| Backend | Supabase migrations + Edge Functions |

## Quick start

```bash
cp .env.example .env
npm install
npm run dev    # http://localhost:8080
```

## Whatâs included for beautiful UI

- Design tokens + `shadow-soft` / `surface-card`
- `AppShell` (sticky nav) + `PageLayout` (page hierarchy)
- Polished `EmptyState`, `Badge`, `Skeleton`
- Reference Home + `/composition` list pattern
- Golden `useAuth` + `useHealth` / `useRefreshHealth`

## Patterns

1. Extend tokens â donât invent a new theme
2. Service â Hook (v5) â Feature â `AppShell` + `PageLayout` page
3. Update `package.json` when adding allowed libraries

Read [AI_INSTRUCTIONS.md](./AI_INSTRUCTIONS.md) before generating code.
