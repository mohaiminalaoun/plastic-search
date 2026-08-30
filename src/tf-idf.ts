// How often this word shows up in this file. I take the log so repeating the
// same word a bunch of times doesn't count as way more relevant.
export function termFrequencyWeight(occurrences: number): number {
  return 1 + Math.log(occurrences);
}

// How rare this word is across all the files. N is how many files I indexed,
// df is how many of those contain the word. I add 1 inside the log so a word
// that shows up in every file still isn't worth zero.
export function inverseDocumentFrequency(
  documentFrequency: number,
  documentCount: number,
): number {
  return Math.log(1 + documentCount / documentFrequency);
}

// One query term's contribution for one file: common here times rare overall.
export function termScore(
  occurrences: number,
  documentFrequency: number,
  documentCount: number,
): number {
  return (
    termFrequencyWeight(occurrences) *
    inverseDocumentFrequency(documentFrequency, documentCount)
  );
}
