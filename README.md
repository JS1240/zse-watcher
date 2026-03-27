# ZSE Watcher

**Bloomberg-tier Croatian stock market dashboard.** Real-time ZSE (Zagrebačka burza) data built for Croatian retail investors.

[ZSE.hr](https://www.zse.hr) | [Live Demo](#) <!-- Add demo URL when deployed -->

---

## What is ZSE Watcher?

ZSE Watcher brings professional-grade market intelligence to Croatian retail investors. Track stocks, monitor the broader market, manage your portfolio, and get smart alerts — all from a single, beautifully designed dashboard that puts the Zagrebačka burza data you actually care about front and center.

We built it because Croatian retail investors deserved better than scattered Excel sheets, half-loaded exchange pages, and Bloomberg terminals that cost more than a car. ZSE Watcher is fast, local, and designed for how people in Croatia actually invest.

---

## Features

| Feature | Description |
|---|---|
| **Stock Screener** | Filter ZSE equities by price, volume, market cap, sector, and performance |
| **Market Heatmap** | Treemap visualization of the entire ZSE market colored by gain/loss |
| **Portfolio Tracker** | Track your positions, P&L, allocation, and dividend history |
| **Price Alerts** | Set threshold-based alerts delivered via email or in-app |
| **Watchlist** | Curated lists of stocks to monitor with real-time updates |
| **Macro Indicators** | CROBEX, EUR/HRK, key macro data from CNB and Eurostat |
| **Premium Tiers** | Freemium model with Essential and Professional plans via Stripe |
| **i18n** | Full Croatian (HR) and English (EN) localization |

---

## Tech Stack

```
Frontend    React 19 · TypeScript 5.7 · Vite 6 (SWC)
Routing     TanStack Router v1 (file-based, auto-generated route tree)
State       TanStack Query v5 (server) · Zustand v5 (client)
Styling     Tailwind CSS v4 (CSS-first config) · Radix UI / shadcn/ui
Charts      TradingView Lightweight Charts v5
i18n        react-i18next (Croatian + English, namespace-based)
Forms       React Hook Form + Zod v4
Payments    Stripe (Checkout + Webhooks via Supabase Edge Functions)
Auth/DB     Supabase (auth, Postgres, Realtime, Edge Functions)
Testing     Vitest + React Testing Library
```

---

## For Developers

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
# Clone the repo
git clone https://github.com/your-org/zse-watcher.git
cd zse-watcher

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Then fill in the required variables (see below)

# Start dev server
npm run dev
```

Dev server runs at **http://localhost:5173**

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (optional — only needed for premium features)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Feature flags
VITE_USE_MOCK_DATA=true   # Set to false when Supabase + ZSE proxy are configured
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run typecheck` | TypeScript type checking only (no emit) |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (run once) |
| `npm run test:watch` | Vitest (watch mode) |

### Architecture

Feature-based layout under `src/features/`. Each feature is self-contained:

```
src/features/<name>/
  api/           # TanStack Query hooks + fetch functions
  components/    # Feature-specific React components
  hooks/         # (optional) Feature-specific hooks
  config/        # (optional) Feature-specific config
```

### Route Structure (10 pages)

| Route | Page |
|---|---|
| `/` | Stocks (default landing) |
| `/macro` | Macro indicators |
| `/heatmap` | Market heatmap |
| `/portfolio` | Portfolio tracker |
| `/dividends` | Dividend history |
| `/alerts` | Price alerts |
| `/screener` | Stock screener |
| `/settings` | User preferences |
| `/pricing` | Premium plans |

### Data Flow

```
Market data: Browser → TanStack Query → Edge Function (zse-proxy) → ZSE REST API
User data:   Browser → TanStack Query → Supabase client (RLS) → Postgres
Payments:    Browser → Edge Function (stripe-checkout) → Stripe API
Webhooks:    Stripe → Edge Function (stripe-webhook) → Update profiles table
```

### Mock Data

Set `VITE_USE_MOCK_DATA=true` to run the full app without Supabase or a ZSE proxy connection. All features work with realistic mock data.

---

## Demo

The app ships with a full dark theme (Bloomberg-inspired) and a light theme toggle. Key UI elements:

- **Sidebar navigation** with keyboard shortcuts (`1-7` for tabs, `Cmd+K` for command palette)
- **Real-time price cards** with change badges and sparklines
- **Market heatmap** treemap colored by daily performance
- **Portfolio dashboard** with allocation pie charts and P&L timeline
- **Command palette** (`Cmd+K`) for quick stock search

---

## Contributing

We welcome contributions from developers interested in Croatian market infrastructure.

### Workflow

1. **Fork** the repository and create your branch from `main`
2. Use **feature branches**: `feature/your-feature-name`
3. **Conventional commits** for commit messages:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `docs:` — documentation
   - `refactor:` — code refactoring
   - `test:` — adding or updating tests
   - `chore:` — tooling, dependencies

### Getting Started

```bash
# Fork and clone your fork
git clone https://github.com/your-username/zse-watcher.git
cd zse-watcher
npm install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then commit
git add -A && git commit -m "feat: add your feature"

# Push and open a Pull Request
git push origin feature/your-feature-name
```

### Pull Request Checklist

- [ ] Code follows the project's style (ESLint passes)
- [ ] TypeScript types are correct (`npm run typecheck` passes)
- [ ] Tests added/updated for new features
- [ ] User-facing text is internationalized (HR + EN) if applicable
- [ ] Commit message follows conventional commits format

---

## License

MIT © Jure Sunic — see [LICENSE](./LICENSE) for full terms.
