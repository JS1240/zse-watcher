/**
 * Croatian number input utilities for localized input handling.
 * Croatian retail investors instinctively type comma as decimal (150,00)
 * while the app uses hr-HR locale for display.
 */

/**
 * Normalizes Croatian number input to standard format.
 * Accepts: "150,00", "150.00", "150000" (no separator), "1.200.300,50"
 * Returns: "150.00" (standard format for API/validation)
 *
 * Also handles currency format: "1.200,50 €" -> "1200.50"
 */
export function normalizeNumberInput(value: string): string {
  if (!value) return value;

  // Strip currency symbols and whitespace
  let cleaned = value.replace(/[€$\s]/g, "").trim();

  // Check if input uses comma as decimal separator (Croatian style)
  // by looking for comma followed by digits at the end
  const hasCroatianDecimal = /,\d{1,2}$/.test(cleaned);

  if (hasCroatianDecimal) {
    // Croatian format: 1.200,50 -> 1200.50
    // Remove thousand separators (.) and replace comma with dot (,)
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/,\d{1,2}$/.test(cleaned)) {
    // Already English format with dot, just validate
    cleaned = cleaned;
  } else if (/^\d+$/.test(cleaned)) {
    // No decimal at all - treat as whole number, keep as is
  } else {
    // Could be English format already (150.00) or ambiguous
    // Leave as-is for browser to handle
  }

  return cleaned;
}

/**
 * Formats a number for Croatian input display.
 * Used when user focuses a field - shows localized format.
 *
 * Returns: "1.200,50" for Croatian locale
 */
export function formatInputNumber(value: number | string, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);

  return num.toLocaleString("hr-HR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Parse a localized Croatian number string to a JavaScript number.
 * "150,00" → 150.00
 * "1.200,50" → 1200.50
 */
export function parseLocalizedNumber(value: string): number {
  const normalized = normalizeNumberInput(value);
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}