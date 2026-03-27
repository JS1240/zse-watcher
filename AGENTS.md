# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

ZSE Watcher is a Bloomberg-tier Croatian stock market dashboard with real-time stock data, news, macro indicators, portfolio tracking, price alerts, and investment signals. Freemium business model (Stripe) targeting Croatian retail investors.

## Tech Stack

- **Framework**: React 19 + TypeScript 5.7 + Vite 6 (SWC)
- **Styling**: Tailwind CSS v4 (CSS-first config, no tailwind.config)
- **Routing**: TanStack Router v1 (file-based, auto-generated route tree)
- **State**: TanStack Query v5 (server state) + Zustand v5 (client state)
- **Auth/DB**: Supabase (auth, Postgres, Realtime, Edge Functions)
- **Charts**: TradingView Lightweight Charts v5
- **Payments**: Stripe (Checkout + Webhooks via Edge Functions)
- **i18n**: react-i18next (Croatian + English, namespace-based)
- **UI**: Radix UI primitives (shadcn pattern), Lucide icons, cmdk
- **Forms**: React Hook Form + Zod v4
- **Testing**: Vitest + React Testing Library

## Commands

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # TypeScript check + Vite build
npm run typecheck    # TypeScript only (no emit)
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
```

## Architecture

Feature-based organization under `src/features/`. Each feature has `api/` (fetch + TanStack Query hooks), `components/`, and optionally `hooks/`, `config/`.

### Routes (10 pages)
`/` (stocks), `/macro`, `/heatmap`, `/portfolio`, `/dividends`, `/alerts`, `/screener`, `/settings`, `/pricing`

### Feature Modules (12)
`stocks`, `market`, `macro`, `news`, `charts`, `portfolio`, `watchlist`, `dividends`, `alerts`, `auth`, `premium`, `settings`

### Directory Structure
- `src/routes/` — TanStack Router file-based routes (auto-generates `route-tree.gen.ts`)
- `src/config/` — Supabase client, i18n, query client, environment validation, constants
- `src/features/*/api/` — TanStack Query hooks + API fetch functions
- `src/features/*/components/` — Feature-specific React components
- `src/components/ui/` — Base UI primitives (Button, Input, Badge, Skeleton, etc.)
- `src/components/layout/` — AppShell, Header, Sidebar, Footer, CommandPalette
- `src/components/shared/` — Financial components (PriceDisplay, ChangeBadge, Sparkline)
- `src/hooks/` — Shared hooks (useAuth, useTheme, useSelectedStock, useKeyboardShortcut)
- `src/types/` — Domain types (Stock, Portfolio, Alert, Market, News, User, Watchlist)
- `src/lib/` — Utilities (cn, formatters, logger, api-client, mock-data, export)
- `src/styles/` — Tailwind globals + Bloomberg dark/light theme CSS variables
- `public/locales/{hr,en}/` — Translation JSON files (5 namespaces each)
- `supabase/migrations/` — SQL schema with RLS policies
- `supabase/functions/` — Edge Functions (zse-proxy, stripe-checkout, stripe-webhook)

## Key Patterns

- **Path alias**: `@/` maps to `src/`
- **Theme**: CSS custom properties (HSL), dark by default, toggle via `useThemeStore`
- **Keyboard shortcuts**: `Cmd+K` (command palette), `1-7` (tabs), `T` (theme), `Escape` (close)
- **Data fetching**: ZSE data proxied via Supabase Edge Functions -> TanStack Query hooks with mock fallback
- **Translations**: All user-visible text uses `t()` from react-i18next, namespace-scoped
- **Premium gating**: `PremiumGate` component wraps premium features, reads tier from Supabase profile
- **Auth guard**: `AuthGuard` component wraps protected routes (portfolio, alerts)
- **Mock data**: Full mock dataset for development without Supabase/ZSE connection

## Data Flow

```
Market data: Browser -> TanStack Query -> Edge Function (zse-proxy) -> ZSE REST API
User data:   Browser -> TanStack Query -> Supabase client (RLS) -> Postgres
Payments:    Browser -> Edge Function (stripe-checkout) -> Stripe API
Webhooks:    Stripe -> Edge Function (stripe-webhook) -> Update profiles table
```

## Supabase Schema

Tables: `profiles`, `watchlists`, `watchlist_items`, `portfolios`, `portfolio_transactions`, `alerts`, `user_preferences`

All user tables have RLS policies restricting access to `auth.uid() = user_id`.
