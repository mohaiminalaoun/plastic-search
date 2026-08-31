# Plasticsearch

Building a small search engine to learn how Elasticsearch works under the hood. Not a clone. Just the parts that matter, small enough that I can actually follow them, test them, and change them.

Right now it reads a few text files and builds an in-memory inverted index. Each term maps to a posting list containing the files where it appears and how many times it appears in each file.

```text
database ->
  database-repeated.txt: 2
  database-once.txt: 1
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

Print each document's indexed length followed by the complete inverted index:

```sh
npm run build-index
```

The index normalizes words to lowercase and removes punctuation from their edges. It still uses basic whitespace tokenization. The five sample documents deliberately control their length and repeated terms so each search below demonstrates one part of ranking.

## Search

Term frequency makes repeated terms more valuable. Both documents below have 60 indexed terms, so the difference comes from `database` appearing twice in one and once in the other:

```sh
npm run search -- database
```

```text
file                  |  score | terms | occurrences
----------------------+--------+-------+------------
database-repeated.txt | 2.1211 |   1/1 |           2
database-once.txt     | 1.2528 |   1/1 |           1
```

A rare term is worth more than a common one. `ranking` appears in one document, while `data` appears once in four documents:

```sh
npm run search -- --operator=or data ranking
```

```text
file                  |  score | terms | occurrences
----------------------+--------+-------+------------
search-engine.txt     | 1.7918 |   1/2 |           1
cache-long.txt        | 0.8109 |   1/2 |           1
cache-short.txt       | 0.8109 |   1/2 |           1
database-once.txt     | 0.8109 |   1/2 |           1
database-repeated.txt | 0.8109 |   1/2 |           1
```

Document length does not affect scoring yet. The two cache documents contain `cache` three times each, so their TF-IDF scores tie even though one has 50 indexed terms and the other has 100. Filename order breaks the tie for now. Later, document-length normalization should make the shorter document rank higher:

```sh
npm run search -- cache
```

```text
file              |  score | terms | occurrences
------------------+--------+-------+------------
cache-long.txt    | 2.0584 |   1/1 |           3
cache-short.txt   | 2.0584 |   1/1 |           3
database-once.txt | 0.9808 |   1/1 |           1
```

AND is the default operator, so every query term must match. Only one sample document contains both `cache` and `database`:

```sh
npm run search -- cache database
```

```text
file              |  score | terms | occurrences
------------------+--------+-------+------------
database-once.txt | 2.2336 |   2/2 |           2
```

OR keeps documents containing either term. Matching both terms gives `database-once.txt` the highest combined score:

```sh
npm run search -- --operator=or cache database
```

```text
file                  |  score | terms | occurrences
----------------------+--------+-------+------------
database-once.txt     | 2.2336 |   2/2 |           2
database-repeated.txt | 2.1211 |   1/2 |           2
cache-long.txt        | 2.0584 |   1/2 |           3
cache-short.txt       | 2.0584 |   1/2 |           3
```

The search-engine sample gives another straightforward AND result:

```sh
npm run search -- search index
```

```text
file              |  score | terms | occurrences
------------------+--------+-------+------------
search-engine.txt | 6.0674 |   2/2 |           4
```

The operator value is case-insensitive, and the `--operator=` flag can appear anywhere after npm's `--` separator. A search with no matches prints nothing.

## Other commands

```sh
npm run dev          # Print word counts from the original reader
npm run debug-search # Run the real files through a small debugging entry point
npm run build        # Compile TypeScript into dist/
npm start            # Run the compiled original reader
npm test             # Run the unit tests
```

The tests use Node's built-in test runner. They cover search behavior, scoring, argument parsing, normalized document lengths, and ASCII table output.

## Current limits

There is no BM25 or document-length normalization yet. There is also no stemming, stop-word handling, phrase search, persistence, API, or UI. Those can come later when I need them.
