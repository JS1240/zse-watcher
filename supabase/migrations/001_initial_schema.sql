-- ZSE Watcher initial schema
-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'hr' CHECK (locale IN ('hr', 'en')),
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Watchlists
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(watchlist_id, ticker)
);

-- Auto-create default watchlist on profile creation
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO watchlists (user_id, name) VALUES (NEW.id, 'Default');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- Portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE portfolio_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend')),
  shares NUMERIC NOT NULL CHECK (shares > 0),
  price_per_share NUMERIC NOT NULL CHECK (price_per_share >= 0),
  total_amount NUMERIC GENERATED ALWAYS AS (shares * price_per_share) STORED,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below', 'percent_change_up', 'percent_change_down')),
  target_value NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ,
  notification_method TEXT NOT NULL DEFAULT 'in_app' CHECK (notification_method IN ('in_app', 'email', 'push')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  default_stock_sort TEXT NOT NULL DEFAULT 'changePct',
  default_sort_direction TEXT NOT NULL DEFAULT 'desc' CHECK (default_sort_direction IN ('asc', 'desc')),
  panel_layout JSONB NOT NULL DEFAULT '{}',
  keyboard_shortcuts_enabled BOOLEAN NOT NULL DEFAULT true,
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  show_turnover BOOLEAN NOT NULL DEFAULT true,
  show_sparklines BOOLEAN NOT NULL DEFAULT true,
  default_chart_range TEXT NOT NULL DEFAULT '1M',
  default_chart_type TEXT NOT NULL DEFAULT 'area',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_watchlist_items_ticker ON watchlist_items(ticker);
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolio_transactions_portfolio_id ON portfolio_transactions(portfolio_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_ticker ON alerts(ticker);
CREATE INDEX idx_alerts_active ON alerts(user_id, is_active) WHERE is_active = true;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Watchlists: users can only access their own
CREATE POLICY watchlists_select ON watchlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY watchlists_insert ON watchlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY watchlists_update ON watchlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY watchlists_delete ON watchlists FOR DELETE USING (auth.uid() = user_id);

-- Watchlist items: via watchlist ownership
CREATE POLICY watchlist_items_select ON watchlist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM watchlists WHERE id = watchlist_id AND user_id = auth.uid()));
CREATE POLICY watchlist_items_insert ON watchlist_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM watchlists WHERE id = watchlist_id AND user_id = auth.uid()));
CREATE POLICY watchlist_items_delete ON watchlist_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM watchlists WHERE id = watchlist_id AND user_id = auth.uid()));

-- Portfolios
CREATE POLICY portfolios_select ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY portfolios_insert ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY portfolios_update ON portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY portfolios_delete ON portfolios FOR DELETE USING (auth.uid() = user_id);

-- Portfolio transactions: via portfolio ownership
CREATE POLICY txn_select ON portfolio_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()));
CREATE POLICY txn_insert ON portfolio_transactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()));
CREATE POLICY txn_delete ON portfolio_transactions FOR DELETE
  USING (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()));

-- Alerts
CREATE POLICY alerts_select ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY alerts_insert ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY alerts_update ON alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY alerts_delete ON alerts FOR DELETE USING (auth.uid() = user_id);

-- User preferences
CREATE POLICY prefs_select ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY prefs_insert ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY prefs_update ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
