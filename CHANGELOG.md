# Changelog

## [Unreleased]

### Added

- **Portfolio Performance Chart** — time-series area chart showing portfolio value over 1D/1W/1M/3M/6M/1Y
  - Built with recharts, integrated into the analytics tab (premium)
  - `usePortfolioHistory` hook: reconstructs historical portfolio value from transactions + mock price history
  - Range selector, gain/loss delta display, gradient fill, reference line at starting value
  - Shows €k format on YAxis, auto-formatted dates on XAxis

- **CSV Export** — download portfolio holdings and stock screener results as CSV
  - Portfolio: CSV button next to Add Position, includes ticker, shares, avg/current price, value, gain, gain %
  - Screener: export button in results bar, all filtered columns
  - Files: `src/features/portfolio/components/portfolio-dashboard.tsx`, `src/features/stocks/components/stock-screener.tsx`

- **Received Dividends Tracker** — record and track dividends paid out
  - `useReceivedDividends` hook: localStorage under key `zse-received-dividends`
  - Record form: ticker, shares, amount/share, currency (EUR/HRK), pay date, notes
  - Grouped by year, total converted to EUR (HRK/7.5)
  - Ticker datalist auto-completes from existing portfolio holdings
  - Portfolio page: new 'dividends' tab alongside holdings/analytics
  - Files: `src/features/portfolio/hooks/use-received-dividends.ts`, `src/features/portfolio/components/received-dividends.tsx`

## [0.1.0] - 2026-03-26

### Added
- **Phase 1: Foundation** - Complete project rebuild from scratch
  - Vite 6 + React 19 + TypeScript 5.7 project scaffold
  - Tailwind CSS v4 with Bloomberg terminal dark/light theme (CSS custom properties)
  - TanStack Router v1 file-based routing (7 routes: stocks, macro, heatmap, portfolio, dividends, alerts, settings)
  - TanStack Query v5 client with financial data refetch defaults
  - Zustand v5 theme store with localStorage persistence
  - react-i18next with Croatian + English translations (5 namespaces)
  - AppShell layout: header, collapsible sidebar with keyboard hints, status bar footer
  - Base UI components (shadcn/Radix pattern): Button, Input, Badge, Skeleton, Separator, Tooltip, ScrollArea
  - Financial components: PriceDisplay, ChangeBadge, ErrorBoundary
  - Command palette (Cmd+K) with navigation and theme toggle
  - Keyboard shortcuts: 1-6 tabs, T theme, Cmd+K palette
  - Supabase client + Zod-validated environment config
  - ESLint 9 flat config + Vitest setup
  - Files: `src/` (config, types, lib, hooks, components, routes, styles)

- **Phase 2: Market Data Core** - Live stock data and market components
  - Supabase Edge Function proxy (`supabase/functions/zse-proxy/`) for ZSE REST API
  - Mock data fallback layer for development without Edge Function
  - TanStack Query hooks: useStocksLive, useMarketStatus, useMovers, useMacro, useNews
  - StockTable with sortable columns, search filter, formatted prices/changes
  - MarketOverview cards (CROBEX, CROBEX10, Euro Stoxx 50, EUR/USD)
  - MarketStatus indicator (open/closed with pulse animation)
  - MarketMovers (top 5 gainers/losers)
  - Sector Heatmap (treemap grouped by sector, color-coded by performance)
  - NewsFeed component with article cards
  - Macro dashboard with index cards, forex rates, investment factors
  - Wired up: Stocks page (table + movers + news sidebar), Heatmap page, Macro page
  - Files: `src/features/{stocks,market,news}/`, `src/lib/{api-client,mock-data}.ts`, `supabase/functions/`

- **Phase 3: Stock Details + Charts** - TradingView charts and stock detail panel
  - Edge Function handlers for stock detail and price history
  - TanStack Query hooks: useStockDetail, useStockHistory with mock data fallback
  - Mock data: stock fundamentals for key tickers + deterministic price history generator
  - TradingChart component wrapping TradingView Lightweight Charts v5 (area + candlestick modes)
  - Volume histogram overlay with color-coded bars (green up, red down)
  - HistoryChart with range selector (1D, 1W, 1M, 3M, 6M, 1Y)
  - StockDetailDrawer: slide-in panel with backdrop blur, Escape to close
  - StockHeader: ticker, name, live price, change badge, sector, ISIN, website link
  - StockFundamentals: market cap, P/E, dividend yield, shares, founded, 52-week range bar
  - Zustand store for selected stock state (useSelectedStock)
  - Clickable stock rows with selected highlight (left border accent)
  - Bloomberg-themed chart colors matching dark/light theme
  - Files: `src/features/{charts,stocks}/`, `src/hooks/use-selected-stock.ts`

- **Phase 4: Auth + User Features** - Supabase auth, user data, and protected features
  - SQL migration with full schema: profiles, watchlists, watchlist_items, portfolios, portfolio_transactions, alerts, user_preferences
  - Row Level Security (RLS) policies on all user tables
  - Auto-create profile + default watchlist on user signup via database triggers
  - useAuth hook: sign in (email/password + Google OAuth), sign up, sign out, password reset
  - Login form + Register form with React Hook Form + Zod validation
  - AuthGuard component wrapping protected routes (portfolio, alerts)
  - LoginPrompt with login/register mode toggle
  - UserMenu dropdown: avatar initials, email, settings link, upgrade CTA, sign out
  - Watchlist feature: star toggle on stock rows, Supabase CRUD with TanStack Query mutations, free tier limit (10 items)
  - Portfolio dashboard: summary cards (total value, gain/loss, holdings count), add position form, holdings table with live P&L
  - AddPositionForm: ticker, type (buy/sell/dividend), shares, price, date
  - Settings page: account info, theme selector (dark/light/system), language selector (HR/EN), keyboard shortcuts reference
  - Protected routes: portfolio and alerts pages show login prompt for unauthenticated users
  - Files: `src/features/{auth,watchlist,portfolio}/`, `src/hooks/use-auth.ts`, `src/routes/{portfolio,alerts,settings}.tsx`, `supabase/migrations/`

- **Phase 5: News + Alerts + Real-time** - Alerts system, enhanced news, dividends, notifications
  - Alerts dashboard: create/delete alerts with Supabase CRUD, free tier limit (3 alerts)
  - AlertForm: ticker, condition (above/below/pct up/down), target value
  - Alert list with toggle active/inactive, triggered status badge, delete action
  - Enhanced NewsFeed: category filter (general/trading), ticker filter, summary preview, category badge
  - Dividends calendar: grouped by month, ex-div and pay dates, yield badge, amount display, past entries faded
  - Mock dividend data for 8 tickers with realistic dates and yields
  - NotificationCenter: bell icon in header with popover showing triggered alerts, unread count badge
  - Alert queries: useAlerts, useActiveAlertCount, useTriggeredAlerts, useCreateAlert, useDeleteAlert, useToggleAlert
  - All pages wired up: alerts (full dashboard), dividends (calendar view), news (enhanced)
  - Files: `src/features/{alerts,dividends,news}/`

- **Phase 6: Analytics + Insights** - Premium features, screener, analytics, export
  - PremiumGate component: blurred preview + lock overlay + upgrade CTA for locked features
  - Tier config system: free vs premium feature definitions, TierLimits interface
  - useSubscription hook: tier detection, canAccess(feature) check
  - Stock Screener (premium): multi-filter by sector, price range, change %, turnover with sortable results table
  - New `/screener` route with PremiumGate wrapper, added to sidebar navigation
  - Portfolio Analytics (premium): total return, best/worst performer metrics, SVG donut chart sector allocation, holdings breakdown bars
  - Portfolio page: holdings/analytics tab switcher with PremiumGate on analytics tab
  - Sparkline component: mini SVG polyline chart with up/down coloring
  - CSV data export utility: stock data export button (visible only for premium users)
  - Files: `src/features/{premium,stocks,portfolio}/`, `src/lib/export.ts`, `src/components/shared/sparkline.tsx`, `src/routes/screener.tsx`

- **Phase 7: Premium + Monetization** - Stripe integration, pricing, and upgrade flow
  - Pricing page (`/pricing`): Free vs Premium comparison with monthly/annual toggle, feature checklist, CTA buttons
  - Pricing config: plan definitions, Stripe price ID mapping, annual discount display
  - Stripe Checkout Edge Function: creates customer, initiates checkout session, stores stripe_customer_id in profile
  - Stripe Webhook Edge Function: handles checkout.session.completed, subscription.updated, subscription.deleted events
  - HMAC signature verification for webhook security
  - Automatic profile.subscription_tier update on payment/cancellation
  - UpgradeModal: feature highlights, annual/monthly CTA, triggered from PremiumGate
  - PremiumGate updated: now opens UpgradeModal with feature context
  - useSubscription reads tier from Supabase profiles table (replaces user_metadata)
  - Stripe API helper: createCheckoutSession, createPortalSession
  - UserMenu "Upgrade" link points to /pricing
  - Files: `supabase/functions/{stripe-checkout,stripe-webhook}/`, `src/features/premium/`, `src/routes/pricing.tsx`

- **Portfolio localStorage persistence** - Transactions survive page refresh
  - Generic `useLocalStorage<T>` hook with cross-tab sync via StorageEvent, quota error handling, and TypeScript generics
  - `useLocalTransactions` hook: manages local-only portfolio transactions with add/remove/clear
  - `LocalTransaction` type: id, ticker, type (buy/sell/dividend), shares, price, date, notes
  - Storage key: `zse-portfolio-transactions`
  - Croatian retail investors can now use the portfolio feature without Supabase auth
  - Files: `src/hooks/use-local-storage.ts`, `src/features/portfolio/hooks/use-local-transactions.ts`

