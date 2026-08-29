import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSearchArguments } from "../src/search-arguments.ts";

test("search arguments default to AND", () => {
  assert.deepEqual(parseSearchArguments(["data", "database"]), {
    operator: "and",
    queryTerms: ["data", "database"],
  });
});

test("the operator is case-insensitive and can appear anywhere", () => {
  const argumentLists = [
    ["--operator=OR", "data", "database"],
    ["data", "--operator=OR", "database"],
    ["data", "database", "--operator=OR"],
  ];

  for (const args of argumentLists) {
    assert.deepEqual(parseSearchArguments(args), {
      operator: "or",
      queryTerms: ["data", "database"],
    });
  }
});

test("invalid operators are rejected", () => {
  assert.throws(() => parseSearchArguments(["--operator=xor", "data"]), Error);
});

test("duplicate operator flags are rejected", () => {
  assert.throws(
    () => parseSearchArguments(["--operator=or", "--operator=and", "data"]),
    Error,
  );
});

test("an operator without query terms is rejected", () => {
  assert.throws(() => parseSearchArguments(["--operator=or"]), Error);
});

test("no arguments return the default operator and an empty query", () => {
  assert.deepEqual(parseSearchArguments([]), {
    operator: "and",
    queryTerms: [],
  });
});
