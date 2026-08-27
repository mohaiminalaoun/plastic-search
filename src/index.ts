import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const documentsDirectory = fileURLToPath(
  new URL("../sample-documents/", import.meta.url),
);

const entries = await readdir(documentsDirectory, { withFileTypes: true });
const textFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
  .map((entry) => entry.name)
  .sort();

for (const fileName of textFiles) {
  const contents = await readFile(
    path.join(documentsDirectory, fileName),
    "utf8",
  );
  const words = contents.trim() === "" ? [] : contents.trim().split(/\s+/);

  console.log(`${fileName}: ${words.length} words`);
}
