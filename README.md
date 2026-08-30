# Plasticsearch

Building a small search engine to learn how Elasticsearch works under the hood. Not a clone. Just the parts that matter, small enough that I can actually follow them, test them, and change them.

Right now it reads a few text files and builds an in-memory inverted index. Each term maps to a posting list containing the files where it appears and how many times it appears in each file.

```text
database ->
  database.txt: 2
  cache.txt: 1
```

Search supports multiple terms with AND and OR. AND/OR decide which files show up. Ranking is TF-IDF: a word that shows up a lot in this file is worth more, and a word that only shows up in a few files is worth more than a word that shows up everywhere. I add those pieces together for each matching query term. Equal scores fall back to filename.

## Runtime

Node.js 24. If you use `nvm`:

```sh
nvm use
```

Install the development dependencies:

```sh
npm install
```

## Build the index

Print the complete inverted index:

```sh
npm run build-index
```

The index normalizes words to lowercase and removes punctuation from their edges. It still uses basic whitespace tokenization.

## Search

AND is the default operator. This only returns files containing every query term:

```sh
npm run search -- data database
```

```text
cache.txt: score=2.4677, terms=2/2, occurrences=3
database.txt: score=2.4677, terms=2/2, occurrences=3
```

Use OR to return files containing any query term:

```sh
npm run search -- --operator=or data index
```

```text
database.txt: score=1.8326, terms=2/2, occurrences=2
cache.txt: score=1.5514, terms=1/2, occurrences=2
search-engine.txt: score=1.5514, terms=1/2, occurrences=2
```

The operator flag is case-insensitive and can appear anywhere after npm's `--` separator. A search with no matches prints nothing.

## Other commands

```sh
npm run dev          # Print word counts from the original reader
npm run debug-search # Run the real files through a small debugging entry point
npm run build        # Compile TypeScript into dist/
npm start            # Run the compiled original reader
npm test             # Run the unit tests
```

The tests use Node's built-in test runner. They cover search behavior, scoring, and argument parsing through public functions rather than depending on the internal index structure.

## Current limits

There is no BM25 or document-length normalization yet. There is also no stemming, stop-word handling, phrase search, persistence, API, or UI. Those can come later when I need them.
