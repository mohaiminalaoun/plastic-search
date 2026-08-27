import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const documentsDirectory = fileURLToPath(
  new URL("../sample-documents/", import.meta.url),
);

type InvertedIndex = Map<string, Set<string>>;

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

// Builds the inverted index by connecting each lowercase word to every file
// containing it.
async function buildInvertedIndex(fileNames: string[]): Promise<InvertedIndex> {
  const invertedIndex: InvertedIndex = new Map();

  for (const fileName of fileNames) {
    const words = await readWords(fileName);

    for (const word of words) {
      const normalizedWord = word.toLowerCase();
      const documents = invertedIndex.get(normalizedWord) ?? new Set<string>();

      documents.add(fileName);
      invertedIndex.set(normalizedWord, documents);
    }
  }

  return invertedIndex;
}

// Prints one sorted index entry per line in the form "word: file1, file2"
function printInvertedIndex(invertedIndex: InvertedIndex): void {
  for (const [word, documents] of [...invertedIndex.entries()].sort()) {
    console.log(`${word}: ${[...documents].join(", ")}`);
  }
}

const textFiles = await findTextFiles(documentsDirectory);
const invertedIndex = await buildInvertedIndex(textFiles);

printInvertedIndex(invertedIndex);
