// One posting keeps track of how often a term appears in one file.
export interface Posting {
  fileName: string;
  occurrences: number;
}

// Each term in the inverted index points to a list of its postings.
export type PostingList = Posting[];

// Postings answer "which files contain this term?" Document term counts answer
// "how long is this file?" after the same normalization the index uses.
export interface InvertedIndex {
  postings: Map<string, PostingList>;
  documentTermCounts: Map<string, number>;
}

// Create the index here so callers don't need to know how it is stored.
export function createInvertedIndex(): InvertedIndex {
  return {
    postings: new Map(),
    documentTermCounts: new Map(),
  };
}

// How many files actually made it into the index. I need this for IDF.
// Empty files never get a posting, so they don't count.
export function indexedDocumentCount(invertedIndex: InvertedIndex): number {
  return invertedIndex.documentTermCounts.size;
}

// Makes indexing and searching use the same term format by lowercasing the word
// and removing punctuation from its edges while preserving internal punctuation.
export function normalizeTerm(term: string): string {
  return term.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

// Adds one document's words to the index. Each posting stores how many times
// the term appeared in that particular document. Tokens that normalize away
// are not indexed and do not count toward the document's length.
export function addDocumentToIndex(
  invertedIndex: InvertedIndex,
  fileName: string,
  words: string[],
): void {
  let termCount = 0;

  for (const word of words) {
    const normalizedWord = normalizeTerm(word);

    if (normalizedWord === "") {
      continue;
    }

    termCount += 1;

    const postings = invertedIndex.postings.get(normalizedWord) ?? [];
    const posting = postings.find((posting) => posting.fileName === fileName);

    if (posting === undefined) {
      postings.push({ fileName, occurrences: 1 });
    } else {
      posting.occurrences += 1;
    }

    invertedIndex.postings.set(normalizedWord, postings);
  }

  if (termCount === 0) {
    return;
  }

  const previousCount = invertedIndex.documentTermCounts.get(fileName) ?? 0;
  invertedIndex.documentTermCounts.set(fileName, previousCount + termCount);
}
