import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addDocumentToIndex, createInvertedIndex } from "./inverted-index.ts";
import { searchIndex, type SearchOperator } from "./search-index.ts";

const documentsDirectory = fileURLToPath(
  new URL("../sample-documents/", import.meta.url),
);
const fileNames = ["cache.txt", "database.txt", "search-engine.txt"];
const invertedIndex = createInvertedIndex();

// Load the real sample files and build the same kind of index used by the app.
for (const fileName of fileNames) {
  const contents = await readFile(
    path.join(documentsDirectory, fileName),
    "utf8",
  );
  const trimmedContents = contents.trim();
  const words = trimmedContents === "" ? [] : trimmedContents.split(/\s+/);

  addDocumentToIndex(invertedIndex, fileName, words);
}

// The repeated mixed-case term is intentional so I can debug its cleanup.
const queryTerms = ["Data", "database", "index", "data"];
const operator: SearchOperator = "and";
const results = searchIndex(invertedIndex, queryTerms, operator);
console.log("Operator:", operator);
console.log(results);
