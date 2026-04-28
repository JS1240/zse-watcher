export function exportToCsv(filename: string, headers: string[], rows: string[][]): void {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        // Escape cells containing commas or quotes
        if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export array of objects to JSON file.
 * Useful for Croatian retail investors who want to analyze data in external tools or Python scripts.
 * 
 * @param filename - Output filename (without extension)
 * @param data - Array of objects to export
 */
export function exportToJson<T>(filename: string, data: T[]): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
