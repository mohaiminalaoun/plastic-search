import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDocumentToIndex,
  createInvertedIndex,
  indexedDocumentCount,
  type InvertedIndex,
} from "../src/inverted-index.ts";
import { searchIndex } from "../src/search-index.ts";
import { termScore } from "../src/tf-idf.ts";

// Build test data through the public indexing API instead of depending on its storage.
function buildTestIndex(documents: Record<string, string[]>): InvertedIndex {
  const invertedIndex = createInvertedIndex();

  for (const [fileName, words] of Object.entries(documents)) {
    addDocumentToIndex(invertedIndex, fileName, words);
  }

  return invertedIndex;
}

// Rebuild the score the same way search does, so I can check the stored number
// without copying the formula into every assertion.
function expectedScore(
  invertedIndex: InvertedIndex,
  fileName: string,
  queryTerms: string[],
): number {
  const documentCount = indexedDocumentCount(invertedIndex);
  let score = 0;

  for (const queryTerm of queryTerms) {
    const postings = invertedIndex.get(queryTerm);
    const posting = postings?.find((entry) => entry.fileName === fileName);

    if (postings === undefined || posting === undefined) {
      continue;
    }

    score += termScore(posting.occurrences, postings.length, documentCount);
  }

  return score;
}

test("document count is the number of unique indexed files", () => {
  const index = buildTestIndex({
    "a.txt": ["alpha", "shared"],
    "b.txt": ["beta", "shared"],
  });

  assert.equal(indexedDocumentCount(index), 2);
});

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
      score: expectedScore(index, "complete.txt", ["alpha", "beta"]),
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
      score: expectedScore(index, "complete.txt", ["alpha", "beta"]),
    },
    {
      fileName: "partial.txt",
      totalQueryTerms: 2,
      matchedQueryTerms: 1,
      matchingTermOccurrences: 1,
      score: expectedScore(index, "partial.txt", ["alpha", "beta"]),
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
      score: expectedScore(index, "data.txt", ["data"]),
    },
  ]);
});

test("a rare term outranks many files that only match a common term", () => {
  const index = buildTestIndex({
    "common-a.txt": ["alpha"],
    "common-b.txt": ["alpha"],
    "common-c.txt": ["alpha"],
    "common-d.txt": ["alpha"],
    "rare.txt": ["beta"],
  });

  const results = searchIndex(index, ["alpha", "beta"], "or");

  assert.equal(results[0]?.fileName, "rare.txt");
  assert.ok(results[0].score > results[1].score);
});

test("more occurrences of the same term still rank higher", () => {
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

test("filename breaks a tie in score", () => {
  const index = buildTestIndex({
    "b.txt": ["alpha"],
    "a.txt": ["alpha"],
  });

  const results = searchIndex(index, ["alpha"], "or");

  assert.deepEqual(
    results.map((result) => result.fileName),
    ["a.txt", "b.txt"],
  );
  assert.equal(results[0].score, results[1].score);
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
      score: expectedScore(index, "alpha.txt", ["alpha"]),
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
