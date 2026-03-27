export type SubscriptionTier = "free" | "premium";
export type ThemeMode = "dark" | "light" | "system";
export type Locale = "hr" | "en";

export interface UserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: Locale;
  theme: ThemeMode;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

export interface UserPreferences {
  defaultStockSort: string;
  defaultSortDirection: "asc" | "desc";
  panelLayout: Record<string, unknown>;
  keyboardShortcutsEnabled: boolean;
  compactMode: boolean;
  showTurnover: boolean;
  showSparklines: boolean;
  defaultChartRange: string;
  defaultChartType: string;
}
