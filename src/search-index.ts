import {
  indexedDocumentCount,
  type InvertedIndex,
  normalizeTerm,
} from "./inverted-index.ts";
import { termScore } from "./tf-idf.ts";

// These are the only search operators I'm supporting for now.
export type SearchOperator = "and" | "or";

// Keep these numbers in the result so I can see why one file ranks above another.
export interface SearchResult {
  fileName: string;
  totalQueryTerms: number; // Unique terms in the query.
  matchedQueryTerms: number; // Query terms found in this file.
  matchingTermOccurrences: number; // Total times those terms appear.
  score: number; // TF-IDF for this file against this query.
}

// Normalize every query term the same way the inverted index does, then remove
// anything that becomes empty, such as a term containing only punctuation.
function normalizeQueryTerms(queryTerms: string[]): string[] {
  return queryTerms.map(normalizeTerm).filter((term) => term !== "");
}

// A repeated query term should only count once toward matching and ranking.
function deduplicateTerms(terms: string[]): string[] {
  return [...new Set(terms)];
}

// OR needs at least one matching query term. AND needs every query term to match.
function matchesSearchOperator(
  result: SearchResult,
  operator: SearchOperator,
): boolean {
  if (operator === "or") {
    return result.matchedQueryTerms > 0;
  }

  return result.matchedQueryTerms === result.totalQueryTerms;
}

// Highest score first. Filename is just a tie-breaker so the order
// doesn't jump around. Copying the array keeps this helper from changing its input.
function rankSearchResults(results: SearchResult[]): SearchResult[] {
  return [...results].sort(
    (left, right) =>
      right.score - left.score || left.fileName.localeCompare(right.fileName),
  );
}

// Search the existing index without changing it. AND keeps complete matches,
// while OR keeps any file that contains at least one query term.
export function searchIndex(
  invertedIndex: InvertedIndex,
  rawQueryTerms: string[],
  operator: SearchOperator,
): SearchResult[] {
  const queryTerms = deduplicateTerms(normalizeQueryTerms(rawQueryTerms));
  const documentCount = indexedDocumentCount(invertedIndex);
  const resultsByFile = new Map<string, SearchResult>();

  for (const queryTerm of queryTerms) {
    const postings = invertedIndex.get(queryTerm);
    if (postings === undefined) {
      continue;
    }

    const documentFrequency = postings.length;

    for (const { fileName, occurrences } of postings) {
      const result = resultsByFile.get(fileName) ?? {
        fileName,
        totalQueryTerms: queryTerms.length,
        matchedQueryTerms: 0,
        matchingTermOccurrences: 0,
        score: 0,
      };

      result.matchedQueryTerms += 1;
      result.matchingTermOccurrences += occurrences;
      result.score += termScore(
        occurrences,
        documentFrequency,
        documentCount,
      );
      resultsByFile.set(fileName, result);
    }
  }

  const matchingResults = [...resultsByFile.values()].filter((result) =>
    matchesSearchOperator(result, operator),
  );
  return rankSearchResults(matchingResults);
}
