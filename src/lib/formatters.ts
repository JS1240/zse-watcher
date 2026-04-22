const EUR_FORMAT = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PRICE_FORMAT = new Intl.NumberFormat("hr-HR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERCENT_FORMAT = new Intl.NumberFormat("hr-HR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "always",
});

const VOLUME_FORMAT = new Intl.NumberFormat("hr-HR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const DATE_FORMAT = new Intl.DateTimeFormat("hr-HR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const TIME_FORMAT = new Intl.DateTimeFormat("hr-HR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatCurrency(value: number): string {
  return EUR_FORMAT.format(value);
}

export function formatPrice(value: number): string {
  return PRICE_FORMAT.format(value);
}

export function formatPercent(value: number): string {
  return `${PERCENT_FORMAT.format(value)}%`;
}

export function formatVolume(value: number): string {
  return VOLUME_FORMAT.format(value);
}

export function formatDate(date: Date | string): string {
  return DATE_FORMAT.format(new Date(date));
}

export function formatRelativeTime(date: Date | string, locale: string = "hr"): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);


  if (diffMin < 1) return locale === "hr" ? "upravo sad" : "just now";
  if (diffMin < 60) return locale === "hr" ? `prije ${diffMin}m` : `${diffMin}m ago`;
  if (diffHr < 24) return locale === "hr" ? `prije ${diffHr}h` : `${diffHr}h ago`;
  if (diffDay < 7) return locale === "hr" ? `prije ${diffDay}d` : `${diffDay}d ago`;
  return formatDate(date);
}

export function formatTime(date: Date | string): string {
  return TIME_FORMAT.format(new Date(date));
}

export function formatMarketCap(valueInMillions: number): string {
  if (valueInMillions >= 1000) {
    return `${(valueInMillions / 1000).toFixed(1)} mlrd EUR`;
  }
  return `${valueInMillions.toFixed(0)} mil EUR`;
}
