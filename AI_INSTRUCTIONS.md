# AI instructions â project boilerplate starter

## Purpose

Complete runnable starter for SJ Innovation AI Code Generation. Agents **copy this tree first**, then implement product features on top.

## Hard boundaries

- Stack: React + Vite + Tailwind + Radix/shadcn + lucide + Zod + React Query **v5** + Supabase JS **v2**
- Data: `src/lib/api/*` â hooks in `src/hooks/*` â features/pages
- Client env only: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Match library APIs to majors in `package.json` (never invent older call shapes)

## UI / UX (required)

Extend this design system â do **not** invent a parallel theme.

| Do | Don't |
|----|--------|
| Use CSS tokens (`primary`, `muted`, `card`, `shadow-soft`) | One-off hex / random gradients |
| `AppShell` + `PageLayout` for chrome & hierarchy | Flat pages with no visual structure |
| One primary CTA per view; clear empty/loading/error | Dense prop-flag cards everywhere |
| Copy `ExampleFeature` / Home patterns | Generic unstyled CRUD dumps |
| DM Sans + existing radius/spacing | New font stack + inconsistent gaps |

Reference: `HomePage`, `AppShell`, `PageLayout`, `EmptyState`, `ExampleFeature`.

## Golden hooks (copy these APIs)

- **Auth (Supabase v2):** `src/hooks/useAuth.ts` â `data: { subscription }` then `subscription.unsubscribe()`
- **Data (React Query v5):** `src/hooks/useHealth.ts` â `useQuery({ queryKey, queryFn })`, `useMutation({ mutationFn, onSuccess })`, `invalidateQueries({ queryKey })`

## Composition

- Children / `ReactNode` slots over boolean `showX` props
- Lazy routes in `App.tsx`; providers only in `AppProviders`
- If you import a new allowed package, update `package.json` in the same change

## Generation order

1. Migrations + RLS (if full-stack)
2. Services + hooks (v5 Query / v2 Auth shapes)
3. Presentational pieces â composed feature â `AppShell` + `PageLayout` page
4. Edge functions only when secrets / privileged server work is required

## Frontend-only vs full-stack

- UI-only: keep Supabase client wired; skip inventing tables
- Full-stack: Supabase only â no Express/Prisma/Next
