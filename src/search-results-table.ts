import type { SearchResult } from "./search-index.ts";

type TableAlignment = "left" | "right";

interface TableColumn {
  header: string;
  align: TableAlignment;
}

function padCell(text: string, width: number, align: TableAlignment): string {
  return align === "right" ? text.padStart(width) : text.padEnd(width);
}

function formatTable(
  columns: TableColumn[],
  rows: string[][],
): string[] {
  const widths = columns.map((column, columnIndex) =>
    Math.max(
      column.header.length,
      ...rows.map((row) => row[columnIndex]?.length ?? 0),
    ),
  );

  const separator = widths.map((width) => "-".repeat(width)).join("-+-");

  const formatRow = (row: string[]): string =>
    row
      .map((cell, columnIndex) =>
        padCell(cell, widths[columnIndex], columns[columnIndex].align),
      )
      .join(" | ");

  return [formatRow(columns.map((column) => column.header)), separator, ...rows.map(formatRow)];
}

// Keep the search-result presentation small and testable without importing the
// executable CLI file.
export function formatSearchResultsTable(
  results: SearchResult[],
): string[] {
  if (results.length === 0) {
    return [];
  }

  return formatTable(
    [
      { header: "file", align: "left" },
      { header: "score", align: "right" },
      { header: "terms", align: "right" },
      { header: "occurrences", align: "right" },
    ],
    results.map((result) => [
      result.fileName,
      result.score.toFixed(4),
      `${result.matchedQueryTerms}/${result.totalQueryTerms}`,
      String(result.matchingTermOccurrences),
    ]),
  );
}
