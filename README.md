# Plasticsearch

Building a small search engine to learn how Elasticsearch works under the hood. Not a clone. Just the parts that matter, small enough that I can actually follow them, test them, and change them.

V1 reads a few text files and builds an inverted index. Each word maps to the documents it shows up in, so search doesn't scan every file from scratch. Tokenization, term frequency, scoring, phrase queries, and persistence come later, when I actually need them.

## Runtime

Node.js 24. If you use `nvm`:

```sh
nvm use
```

## First milestone

Take a handful of text files, build an in-memory inverted index, and look up which documents contain a search term.
