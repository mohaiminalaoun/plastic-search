# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Plasticsearch is a small search engine built to learn how Elasticsearch works under the hood — not a clone, just the core parts (inverted index, tokenization, term frequency, scoring, phrase queries, persistence), implemented small enough to follow, test, and change.

The project is at its very first milestone: take a handful of text files, build an in-memory inverted index, and look up which documents contain a search term. There is no source code yet (no `index.js` or `src/` directory) — the codebase is currently just `package.json`, `README.md`, and `.nvmrc`.

## Runtime

Node.js 24 (CommonJS, `"type": "commonjs"` in package.json). If using `nvm`:

```sh
nvm use
```

## Commands

No build, lint, or test scripts are wired up yet — `npm test` is a placeholder that exits with an error. `eslint` and `prettier` are listed as devDependencies but have no config files in the repo yet; check for `eslint.config.js`/`.prettierrc` before assuming a lint/format command exists.

## Scope notes

The README explicitly scopes this as incremental: only build what's needed for the current milestone. Tokenization, scoring, phrase queries, and persistence are called out as later work, not to be added ahead of need.
