/**
 * CSV import utilities for ZSE Watcher
 * Supports importing tickers from CSV files exported from ZSE Watcher or other sources
 */

/**
 * Parse tickers from CSV file content
 * Expects first column to be ticker (e.g., from watchlist or portfolio CSV export)
 * Returns array of unique tickers found in the file
 *
 * @param content - CSV file content as string
 * @returns Array of ticker strings (uppercase, trimmed, unique, sorted)
 */
export function parseTickersFromCsv(content: string): string[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return []; // Need at least header + 1 data row

  // Find ticker column index - look for "Ticker" in header
  const header = parseCsvLine(lines[0]);
  let tickerIndex = header.findIndex(
    (col) => col.toLowerCase() === "ticker" || col.toLowerCase() === "ticker (eur)"
  );

  // If not found, check first column (common for simple lists)
  if (tickerIndex === -1) {
    tickerIndex = 0;
  }

  const tickers = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const ticker = cols[tickerIndex]?.trim().toUpperCase();
    // Validate ticker format: 3-10 alphanumeric characters ( Croatian tickers may have - _ )
    if (ticker && /^[A-Z0-9_-]{3,10}$/.test(ticker)) {
      tickers.add(ticker);
    }
  }

  return Array.from(tickers).sort();
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}

/**
 * Read a File and return its content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}