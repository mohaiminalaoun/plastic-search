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

The index normalizes words to lowercase and removes punctuation from their edges. It still uses basic whitespace tokenization. The five sample documents deliberately control their length and repeated terms so each search below demonstrates one part of ranking.

## Search

Term frequency makes repeated terms more valuable. Both documents below have 60 words, so the difference comes from `database` appearing twice in one and once in the other:

```sh
npm run search -- database
```

```text
database-repeated.txt: score=2.1211, terms=1/1, occurrences=2
database-once.txt: score=1.2528, terms=1/1, occurrences=1
```

A rare term is worth more than a common one. `ranking` appears in one document, while `data` appears once in four documents:

```sh
npm run search -- --operator=or data ranking
```

```text
search-engine.txt: score=1.7918, terms=1/2, occurrences=1
cache-long.txt: score=0.8109, terms=1/2, occurrences=1
cache-short.txt: score=0.8109, terms=1/2, occurrences=1
database-once.txt: score=0.8109, terms=1/2, occurrences=1
database-repeated.txt: score=0.8109, terms=1/2, occurrences=1
```

Document length does not affect scoring yet. The two cache documents contain `cache` three times each, so their TF-IDF scores tie even though one has 50 words and the other has 100. Filename order breaks the tie for now. Later, document-length normalization should make the shorter document rank higher:

```sh
npm run search -- cache
```

```text
cache-long.txt: score=2.0584, terms=1/1, occurrences=3
cache-short.txt: score=2.0584, terms=1/1, occurrences=3
database-once.txt: score=0.9808, terms=1/1, occurrences=1
```

AND is the default operator, so every query term must match. Only one sample document contains both `cache` and `database`:

```sh
npm run search -- cache database
```

```text
database-once.txt: score=2.2336, terms=2/2, occurrences=2
```

OR keeps documents containing either term. Matching both terms gives `database-once.txt` the highest combined score:

```sh
npm run search -- --operator=or cache database
```

```text
database-once.txt: score=2.2336, terms=2/2, occurrences=2
database-repeated.txt: score=2.1211, terms=1/2, occurrences=2
cache-long.txt: score=2.0584, terms=1/2, occurrences=3
cache-short.txt: score=2.0584, terms=1/2, occurrences=3
```

The search-engine sample gives another straightforward AND result:

```sh
npm run search -- search index
```

```text
search-engine.txt: score=6.0674, terms=2/2, occurrences=4
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
