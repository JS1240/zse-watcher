# Changelog

## [Unreleased]

### Changed
- **NotificationCenter Badge Colors** — normalize triggered alert badge to match codebase amber patterns
  - Replaced hardcoded amber-500/20, amber-700, amber-900/50 with standard bg-amber
  - Consistent with triggered status badge in alerts-dashboard.tsx
  - Croatian retail investors get consistent visual language throughout the app

- **Sidebar Typography**: increased desktop sidebar label and shortcut text size for better readability · files: `src/components/layout/sidebar.tsx` · migration: none
- **Global Dashboard Typography**: increased base font size and raised tiny label utility sizes for better app-wide readability · files: `src/styles/globals.css` · migration: none
- **Stock Table Typography**: increased stock table header, row, ticker, company, numeric, and loading-state font sizes for better readability · files: `src/features/stocks/components/stock-table.tsx`, `src/features/stocks/components/stock-row.tsx`, `src/features/stocks/components/stock-table-skeleton.tsx` · migration: none

- **News Feed Keyboard Shortcuts Always Visible** — improve discoverability for Croatian retail investors
  - Changed keyboard shortcuts hint from tooltip-hover to always visible (matching stocks/watchlist/portfolio pattern)
  - Shows ↑↓ navigiraj, Enter otvori, / traži directly in the results bar
  - Helps users discover keyboard navigation without hovering

- **Enhanced Portfolio CSV Export** — add fundamental data for Croatian retail investors
  - Added P/E Ratio and Dividend Yield columns to portfolio CSV exports
  - Works in both local and authenticated portfolio views
  - Enables better fundamental analysis for investment decisions

- **Custom Illustration for Received Dividends Empty State** — visual polish for Croatian retail investors
  - Replaced generic Receipt icon with DividendsCalendarEmptyIllustration
  - Consistent with other empty states using custom SVG illustrations

- **P/E Ratio and Market Cap in Stock Table** — fundamental data for Croatian retail investors
  - Added sortable P/E and Market Cap columns to stock table (visible at 2xl+ screen width)
  - Added peRatio and marketCapM fields to Stock type, populated in mock data
  - Updated CSV export to include P/E ratio and market cap columns
  - Fixed watchlist CSV export type casting for proper Stock type fields

### Added

- **Performance: Memoized Watchlist Components** — prevent unnecessary re-renders for Croatian retail investors
  - Wrapped WatchlistTable and WatchlistRow with memo() and custom comparison functions
  - Only re-renders when relevant props actually change
  - Helps users with larger watchlists avoid lag when filtering, sorting, or searching

- **Triggered Timestamp on Alert Rows** — show when triggered alerts fired for Croatian retail investors
  - Added triggeredAt date display between created date and triggered badge
  - Shows "→ 24.04.2026" format in amber color to distinguish from creation time
  - Helps users know exactly when their target price was hit
  - Null-safe: only shows when alert.isTriggered AND alert.triggeredAt exists

### Added

- **News Feed Polish** — visual and UX improvements for Croatian retail investors
### Added

- **Sparklines in Portfolio Holdings Table** — add price trend visualization for Croatian retail investors
  - Added Sparkline component column to both local and authenticated portfolio dashboards
  - Generates 1W mock price history for each holding (works offline without extra API calls)
  - Shows mini sparkline trend chart next to each ticker in holdings table
  - Helps Croatian retail investors quickly see price direction at a glance
  - Consistent with existing Sparkline component usage in premium analytics

### Added

- **Custom SVG Illustrations for Stock Table Empty States** — replace generic icons with purpose-built SVGs for Croatian retail investors
  - Added `StockListEmptyIllustration` (stock ticker rows + sparkline chart metaphor)
  - Reused existing `SearchEmptyIllustration` for no-results empty state
  - Replaced generic lucide `Search`/`TrendingUp` icons with custom SVGs
  - Consistent with portfolio/watchlist custom illustration patterns

### Added

- **Quick Filter Chips and Sector Dropdown for Stock Table** — improve discoverability for Croatian retail investors
  - Added gainers/losers/unchanged filter chips with TrendingUp/Down/Minus icons
  - Added dynamic sector filter dropdown (populated from unique sectors in data)
  - Added results count badge next to live data indicator
  - Filter pipeline updated in useMemo alongside search and sort
  - Consistent UX with watchlist page filters

- **Stock Table Always-Visible Keyboard Shortcuts** — make shortcuts discoverable for Croatian retail investors
  - Changed keyboard shortcuts hint from hover-only to always visible (no more `invisible group-hover:visible` pattern)
  - Added `/` search shortcut hint to the stock table footer
  - Wrapped SortIcon component with memo() to prevent unnecessary re-renders
  - Removed unused group-hover visibility pattern since shortcuts are now always visible
  - Aligns with previous commit about always-visible keyboard shortcuts discoverability

### Added

- **Storybook Dark Mode Default** — set dark as default background for Croatian retail investor app dev
  - Default background changed from 'light' to 'dark' to match app default
  - Created .storybook/vitest.config.ts for @storybook/addon-vitest testing
  - Removes unused a11y.test='todo' placeholder (addon handles testing)

### Added

- **Interactive Hover States for Macro Cards** — improve tactile feel for Croatian retail investors
  - IndexCard: hover lift with shadow and border color change
  - Forex card: subtle lift effect on hover
  - FactorItem: scale-up transform on hover for emphasis
  - Smooth 200ms transitions for polished feel

### Added

- **Keyboard Navigation for Watchlist Table Headers** — sort columns with keyboard for Croatian investors
  - Added onKeyDown handler for Enter/Space to sort watchlist columns
  - Added tabIndex=0 and role=columnheader for keyboard accessibility
  - Fixed aria-sort to use explicit variable (matching stock-table pattern)
  - Descriptive aria-label communicates sort state to screen readers
  - Aligns with stock table accessibility patterns

### Added

- **Custom SVG Illustrations for Empty States** — replace generic icons with purpose-built SVGs for Croatian retail investors
  - WatchlistEmptyIllustration: stock chart trending up with star accent
  - PortfolioEmptyIllustration: bar chart portfolio-building metaphor
  - PortfolioSoldIllustration: empty bag with X for sold-out state
  - SearchEmptyIllustration: magnifying glass with question mark for no-search-results
  - AnalyticsEmptyIllustration: pie chart + bars for empty analytics
  - EmptyState variant changed to 'action' for better CTA prominence
  - iconClassName prop added to EmptyState for precise sizing
  - Missing confirmRemove translations added to watchlist locales (HR + EN)

### Added

- **Keyboard Navigation for Stock Table Headers** — sort columns with keyboard for Croatian investors
  - Added onKeyDown handler for Enter/Space to sort table columns
  - Added tabIndex=0 and role=columnheader for accessibility
  - Screen reader support with aria-sort and descriptive labels
  - Aligns with alert row keyboard patterns already in codebase

### Added

- **Responsive Chart Height for Mobile** — charts adapt to screen size for Croatian investors
  - getResponsiveHeight() scales chart based on container width
  - <400px width → 200px height; <640px → 250px height; ≥640px → 300px
  - Smoothly adjusts when drawer resizes or screen rotates
  - Better mobile experience in stock detail drawer

- **Sector Filter for Local Watchlist** — filter watched stocks by sector for Croatian retail investors
  - Added sector dropdown matching authenticated watchlist pattern
  - Shows only sectors present in watched stocks
  - Enables quick filtering like \"Svi sektori\" → \"Telekomunikacije\"
  - Consistent with authenticated watchlist and stock screener

- **Alert Sorting** — sort alerts by newest, oldest, A-Z, or target value
  - Dropdown selector in alerts dashboard toolbar
  - Default sort: newest first
  - Helps Croatian retail investors find and organize alerts faster

- **Collapsible Filter Panel for Stock Screener** — improve space efficiency for Croatian retail investors
  - Active filter count badge shows number of active filters (e.g., "2" when sector + minPrice set)
  - Chevron toggle to collapse/expand filter inputs with smooth animation
  - Presets row moves above filters with collapse toggle for clean layout
  - Saves screen space on smaller devices — critical for mobile investors

- **Price Flash for Watchlist** — visual price change feedback for Croatian retail investors
  - Green/red flash animation on price changes (matching stocks table pattern)
  - Works in both local and authenticated watchlist views
  - Uses usePriceFlash hook to detect price direction between renders
  - Helps investors spot live price changes during trading sessions

### Added

- **SettingsSkeleton Component** — polished loading state for settings page
  - Matches the exact layout: account section, theme toggle, language selector, keyboard shortcuts
  - Shows skeleton while checking auth state (was returning empty null before)
  - Consistent with PortfolioSkeleton, AlertsSkeleton, PricingSkeleton patterns
  - Croatian retail investors now see polished loading state while auth loads

- **EmptyState Visual Polish** — improve empty state UX for Croatian retail investors
  - Add floating animation to empty state icons (subtle 4px vertical movement)
  - Use Lightbulb icon for hint pills instead of emoji
  - Polish hint layout with inline flexbox styling
  - Makes empty states feel alive rather than static
  - Filter pills: 📈 Dobitnici (gainers), 📉 Gubitnici (losers), ➡️ Nepromijenjeno (unchanged)
  - Works in both local and authenticated watchlist views
  - Combines with search for powerful filtering
  - Croatian retail investors can quickly see today's movers

### Performance

- **Portfolio Holdings Memoization** — memoize holdings calculations to prevent unnecessary recalculation
  - HoldigsMap and enrichedHoldings now memoized with useMemo in LocalPortfolioDashboard
  - enrichedHoldings and totals memoized in authenticated PortfolioDashboard
  - Calculations only run when transactions or stocks change, not on every render
  - Improves responsiveness for Croatian retail investors with larger portfolios

### Fixed

- **Light Theme Color Contrast** — improve accessibility for Croatian retail investors
  - Increase muted-foreground from 45% to 55% lightness for better readability
  - Improve price colors: price-up (32%), price-down (48%), price-neutral (55%)
  - Darken border and input from 90% to 85% for better visibility
  - All changes ensure WCAG AA contrast ratios on light backgrounds

### Changed

- **MarketOverview Loading State** — uses MarketOverviewSkeleton for polished loading UI
  - Matches the exact layout: CROBEX (accent), CROBEX10, Euro Stoxx 50, EUR/USD
  - Consistent with DividendsSkeleton and MacroSkeleton patterns
  - Croatian retail investors see polished loading states throughout

- **DividendsCalendar Loading State** — uses DividendsSkeleton for polished loading UI
  - Replaces inline skeleton divs with reusable DividendsSkeleton
  - Consistent with other pages (ScreenerSkeleton, WatchlistSkeleton)

### Added

- **MacroSkeleton Component** — polished loading state for macro/economic indicators page
  - Matches IndexCard, ForexCard, and FactorItem layouts exactly
  - Shows ticker skeleton for each index (CROBEX, CROBEX10, Euro Stoxx 50)
  - Forex skeleton with EUR/HRK, EUR/USD, etc.
  - Investment factors skeleton (GDP, inflation, unemployment, interest rate)

- **Year Filter for Dividends Page** — filter dividends by year for tax reporting
  - Year dropdown to view dividends by specific year
  - Defaults to most recent year on load
  - CSV export includes selected year in filename 
  - Croatian retail investors can filter for porez na dividende

- **HeatmapSkeleton Component** — polished loading state for sector heatmap page
  - Realistic sector grid layout with varying cell sizes
  - Legend placeholders (top and bottom gradient bar)
  - Hover details panel skeleton
  - Matches the design of the live heatmap component visually

### Added

- **Focus States for Keyboard Navigation** — accessibility improvements for Croatian retail investors
  - `:focus-visible` outline styles in globals.css
  - Button component with focus ring offset
  - StockRow already had proper focus-visible, now unified
  - Removes default `:focus` outline for mouse users while keeping keyboard accessibility

### Added

- **CSV Export for Alerts** — export alerts to CSV for backup and analysis
  - Export button in alerts dashboard (visible when alerts exist)
  - Columns: Ticker, Condition, Target, Status, Active, Created date
  - Localized condition labels and date format
  - Toast confirmation on export

- **EmptyState 'no-results' variant** — distinguishes zero-results from zero-data states
  - Variant `'no-results'` for filters/search returning empty (prominent clear action)
  - StockScreener: shows only when stocks exist but filters match nothing
  - Shows `variant="info"` when stocks are still loading

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
