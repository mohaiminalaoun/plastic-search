import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDocumentToIndex,
  createInvertedIndex,
  type InvertedIndex,
} from "../src/inverted-index.ts";
import { searchIndex } from "../src/search-index.ts";

// Build test data through the public indexing API instead of depending on its storage.
function buildTestIndex(documents: Record<string, string[]>): InvertedIndex {
  const invertedIndex = createInvertedIndex();

  for (const [fileName, words] of Object.entries(documents)) {
    addDocumentToIndex(invertedIndex, fileName, words);
  }

  return invertedIndex;
}

test("AND only returns files containing every unique query term", () => {
  const index = buildTestIndex({
    "complete.txt": ["alpha", "alpha", "beta"],
    "partial.txt": ["alpha"],
  });

  assert.deepEqual(searchIndex(index, ["alpha", "beta"], "and"), [
    {
      fileName: "complete.txt",
      totalQueryTerms: 2,
      matchedQueryTerms: 2,
      matchingTermOccurrences: 3,
    },
  ]);
});

test("OR returns complete and partial matches", () => {
  const index = buildTestIndex({
    "complete.txt": ["alpha", "alpha", "beta"],
    "partial.txt": ["alpha"],
  });

  assert.deepEqual(searchIndex(index, ["alpha", "beta"], "or"), [
    {
      fileName: "complete.txt",
      totalQueryTerms: 2,
      matchedQueryTerms: 2,
      matchingTermOccurrences: 3,
    },
    {
      fileName: "partial.txt",
      totalQueryTerms: 2,
      matchedQueryTerms: 1,
      matchingTermOccurrences: 1,
    },
  ]);
});

test("query terms are normalized and deduplicated", () => {
  const index = buildTestIndex({
    "data.txt": ["Data.", "data"],
  });

  assert.deepEqual(searchIndex(index, ["DATA.", "(data)", "data"], "and"), [
    {
      fileName: "data.txt",
      totalQueryTerms: 1,
      matchedQueryTerms: 1,
      matchingTermOccurrences: 2,
    },
  ]);
});

test("broader term coverage ranks above more repetitions of one term", () => {
  const index = buildTestIndex({
    "broad.txt": ["alpha", "beta"],
    "repeated.txt": ["alpha", "alpha", "alpha", "alpha", "alpha"],
  });

  const results = searchIndex(index, ["alpha", "beta"], "or");

  assert.deepEqual(
    results.map((result) => result.fileName),
    ["broad.txt", "repeated.txt"],
  );
});

test("occurrences break a tie in query-term coverage", () => {
  const index = buildTestIndex({
    "frequent.txt": ["alpha", "alpha", "alpha"],
    "quiet.txt": ["alpha"],
  });

  const results = searchIndex(index, ["alpha"], "or");

  assert.deepEqual(
    results.map((result) => result.fileName),
    ["frequent.txt", "quiet.txt"],
  );
});

test("filename breaks a tie in coverage and occurrences", () => {
  const index = buildTestIndex({
    "b.txt": ["alpha"],
    "a.txt": ["alpha"],
  });

  const results = searchIndex(index, ["alpha"], "or");

  assert.deepEqual(
    results.map((result) => result.fileName),
    ["a.txt", "b.txt"],
  );
});

test("missing terms fail AND but do not remove OR matches", () => {
  const index = buildTestIndex({
    "alpha.txt": ["alpha"],
  });

  assert.deepEqual(searchIndex(index, ["alpha", "missing"], "and"), []);
  assert.deepEqual(searchIndex(index, ["alpha", "missing"], "or"), [
    {
      fileName: "alpha.txt",
      totalQueryTerms: 2,
      matchedQueryTerms: 1,
      matchingTermOccurrences: 1,
    },
  ]);
});

test("an empty query returns no results", () => {
  const index = buildTestIndex({
    "alpha.txt": ["alpha"],
  });

  assert.deepEqual(searchIndex(index, [], "and"), []);
  assert.deepEqual(searchIndex(index, [], "or"), []);
});
