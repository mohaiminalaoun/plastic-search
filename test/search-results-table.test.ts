import assert from "node:assert/strict";
import { test } from "node:test";
import { formatSearchResultsTable } from "../src/search-results-table.ts";

test("search results are rendered as an ASCII table", () => {
  assert.deepEqual(
    formatSearchResultsTable([
      {
        fileName: "search-engine.txt",
        totalQueryTerms: 3,
        matchedQueryTerms: 1,
        matchingTermOccurrences: 2,
        score: 3.0337,
      },
      {
        fileName: "database-once.txt",
        totalQueryTerms: 3,
        matchedQueryTerms: 2,
        matchingTermOccurrences: 2,
        score: 2.2336,
      },
    ]),
    [
      "file              |  score | terms | occurrences",
      "------------------+--------+-------+------------",
      "search-engine.txt | 3.0337 |   1/3 |           2",
      "database-once.txt | 2.2336 |   2/3 |           2",
    ],
  );
});

test("an empty search returns no table output", () => {
  assert.deepEqual(formatSearchResultsTable([]), []);
});
