export type PostingList = Map<string, number>;
export type InvertedIndex = Map<string, PostingList>;

// Makes indexing and searching use the same term format by lowercasing the word
// and removing punctuation from its edges while preserving internal punctuation.
export function normalizeTerm(term: string): string {
  return term.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

// Adds one document's words to the index. Each posting stores how many times
// the term appeared in that particular document.
export function addDocumentToIndex(
  invertedIndex: InvertedIndex,
  fileName: string,
  words: string[],
): void {
  for (const word of words) {
    const normalizedWord = normalizeTerm(word);

    if (normalizedWord === "") {
      continue;
    }

    const postings =
      invertedIndex.get(normalizedWord) ?? new Map<string, number>();
    const currentCount = postings.get(fileName) ?? 0;

    postings.set(fileName, currentCount + 1);
    invertedIndex.set(normalizedWord, postings);
  }
}
