# Changelog

## [Unreleased]

### Added

- **ErrorState Component** — reusable error display with retry button for failed API calls
  - Red circle-X icon, title + description + optional hint
  - Retry button that calls `refetch()` on the failed query
  - Integrated into StockScreener, AlertsDashboard, and NewsFeed components

### Fixed

- **Empty State for Sold Portfolio** — local portfolio now shows EmptyState with Wallet icon when all positions are sold, distinguishing between zero transactions and "all sold" states with contextual HR/EN copy

### Added

- **Watchlist Sortable Columns** — click any column header to sort by name, price, change, volume, or turnover
  - Sort descending by default; click again to reverse; third click clears sort
  - SortHeader component with ArrowUp/ArrowDown/ArrowUpDown indicators matching the stock screener pattern
  - Works in both authenticated (Supabase) and local (localStorage) watchlist views

- **Watchlist Page** — unauthenticated users get a full watchlist with localStorage persistence
  - New `/watchlist` route with sidebar link (shortcut 8) and Star icon
  - Authenticated users: managed via Supabase (existing behavior)
  - Guest users: `useLocalWatchlist` hook with localStorage under `zse-watchlist`
  - Unified `WatchlistPage` component shows `AuthenticatedWatchlist` or `LocalWatchlist` based on auth state
  - Table: ticker, name, price, change, volume, turnover — click to open stock detail drawer
  - Local watchlist: filled star with remove button; authenticated: unfilled star toggle
  - Search filtering by ticker/name, skeleton loading states, EmptyState for zero items and no-results
  - i18n: `nav.watchlist`, `nav.screener`, `searchPlaceholder`, `emptyDescription`, `browseAction` in both HR/EN

- **Portfolio Performance Chart** — time-series area chart showing portfolio value over 1D/1W/1M/3M/6M/1Y
  - Built with recharts, integrated into the analytics tab (premium)
  - `usePortfolioHistory` hook: reconstructs historical portfolio value from transactions + mock price history
  - Range selector, gain/loss delta display, gradient fill, reference line at starting value
  - Shows €k format on YAxis, auto-formatted dates on XAxis

- **CSV Export** — download portfolio holdings and stock screener results as CSV
  - Portfolio: CSV button next to Add Position, includes ticker, shares, avg/current price, value, gain, gain %
  - Screener: export button in results bar, all filtered columns

- **Received Dividends Tracker** — record and track dividends paid out
  - `useReceivedDividends` hook: localStorage under key `zse-received-dividends`
  - Record form: ticker, shares, amount/share, currency (EUR/HRK), pay date, notes
  - Grouped by year, total converted to EUR (HRK/7.5)
  - Portfolio page: new 'dividends' tab alongside holdings/analytics

- **News Article Drawer** — inline article view instead of opening new tab
  - `ArticleDrawer` component: slide-in panel with title, summary, source, date/time
  - Escape or backdrop click to close
  - 'Read full article on ZSE.hr' CTA button

- **PWA Installability** — add to home screen as native app
  - `public/manifest.json`: standalone display, purple theme, shortcuts for Stocks/Portfolio/Alerts
  - `public/sw.js`: cache-first for static assets, network-first for API, clean old caches on activate
  - Apple mobile web app meta tags for iOS home screen

- **Keyboard Shortcuts Overlay** — press ? to see all shortcuts
  - ShortcutsOverlay: modal with Navigation/App/Stock Table shortcut groups
  - Escape or backdrop click to close; T works while overlay is open
  - Global Cmd+K (Ctrl+K) shortcut wired via event bus for command palette
  - eventBus: simple in-process pub/sub for cross-component communication
  - Updated keyboard shortcuts reference in Settings page

- **Screener Filter Presets** — save and recall filter configurations
  - Save current filter set with a custom name inline in the filter bar
  - Presets stored in localStorage under key `zse-screener-presets`
  - Click preset pill to load, X to delete; persists across sessions

- **Heatmap Sector Drill-Down** — click a sector to see all stocks within it
  - SectorDrawer: slide-in panel with sortable table of all stocks in that sector
  - Click sector name in heatmap cell, Escape or backdrop to close
  - Shows ticker, price, change, turnover, volume; click ticker to open stock detail drawer

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


- **Heatmap Sector Drill-Down** — click a sector to see all stocks within it
  - SectorDrawer: slide-in panel with sortable table of all stocks in that sector
  - Click sector name in heatmap cell, Escape or backdrop to close
  - Shows ticker, price, change, turnover, volume; click ticker to open stock detail drawer

- **Alerts LocalStorage Persistence** — unauthenticated users can now set alerts
  - useLocalAlerts hook: localStorage under key zse-local-alerts
  - useAlertsData: unified hook (Supabase for auth users, localStorage for guests)
  - AlertRow shows 'local' badge for guest alerts
  - Works without signing in

- **Live Forex Rates on Macro Page** — real EUR/USD, USD/CHF, EUR/GBP, EUR/GBP
  - useForexRates hook: fetches from frankfurter.app API every 5 minutes
  - 2-column grid with 4 major pairs + EUR/HRK (CNB fixing, semi-fixed at 7.5)
  - Graceful fallback on network failure

- **Related News in Stock Detail Drawer** — latest 5 articles per ticker
  - StockFundamentals: shows filtered news for the current ticker at bottom of fundamentals section
  - Each item: title, date, source, external link; click to open on ZSE.hr
  - Ties the news feed and stock detail together inline
