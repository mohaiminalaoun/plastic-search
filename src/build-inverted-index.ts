import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  addDocumentToIndex,
  createInvertedIndex,
  type InvertedIndex,
  type Posting,
  type PostingList,
} from "./inverted-index.ts";
import { parseSearchArguments } from "./search-arguments.ts";
import { searchIndex, type SearchResult } from "./search-index.ts";
import { formatSearchResultsTable } from "./search-results-table.ts";

const documentsDirectory = fileURLToPath(
  new URL("../sample-documents/", import.meta.url),
);

// Finds every .txt document in the sample directory and sorts the names so the
// script produces the same output order every time.
async function findTextFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
    .map((entry) => entry.name)
    .sort();
}

// Reads one document and splits its contents on whitespace.
async function readWords(fileName: string): Promise<string[]> {
  const contents = await readFile(
    path.join(documentsDirectory, fileName),
    "utf8",
  );
  const trimmedContents = contents.trim();

  return trimmedContents === "" ? [] : trimmedContents.split(/\s+/);
}

// Builds the inverted index one document at a time after the file-loading layer
// has converted each document into an array of words.
async function buildInvertedIndex(fileNames: string[]): Promise<InvertedIndex> {
  const invertedIndex = createInvertedIndex();

  for (const fileName of fileNames) {
    const words = await readWords(fileName);

    addDocumentToIndex(invertedIndex, fileName, words);
  }

  return invertedIndex;
}

// Sorts postings from highest to lowest term count. Equal counts use the file
// name as a tie-breaker so the output remains predictable.
function sortPostingsByCount(postings: PostingList): Posting[] {
  return [...postings].sort(
    (left, right) =>
      right.occurrences - left.occurrences ||
      left.fileName.localeCompare(right.fileName),
  );
}

// Prints each file's indexed length, then the term-to-postings map.
function printInvertedIndex(invertedIndex: InvertedIndex): void {
  for (const [fileName, termCount] of [
    ...invertedIndex.documentTermCounts.entries(),
  ].sort()) {
    console.log(`${fileName}: ${termCount} terms`);
  }

  console.log("");

  for (const [word, postings] of [...invertedIndex.postings.entries()].sort()) {
    const formattedPostings = sortPostingsByCount(postings)
      .map(({ fileName, occurrences }) => `${fileName} (${occurrences})`)
      .join(", ");

    console.log(`${word}: ${formattedPostings}`);
  }
}

// Print the values used to rank each result so I can see why a file came first.
function printSearchResults(results: SearchResult[]): void {
  for (const line of formatSearchResultsTable(results)) {
    console.log(line);
  }
}

const textFiles = await findTextFiles(documentsDirectory);
const invertedIndex = await buildInvertedIndex(textFiles);
const searchArguments = process.argv.slice(2);

if (searchArguments.length === 0) {
  printInvertedIndex(invertedIndex);
} else {
  try {
    const { operator, queryTerms } = parseSearchArguments(searchArguments);
    const results = searchIndex(invertedIndex, queryTerms, operator);

    printSearchResults(results);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
