import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inverseDocumentFrequency,
  termFrequencyWeight,
  termScore,
} from "../src/tf-idf.ts";

test("one mention of a word is worth 1", () => {
  assert.equal(termFrequencyWeight(1), 1);
});

test("repeating a word helps, but not 10x for 10 mentions", () => {
  const tenMentions = termFrequencyWeight(10);
  const oneMention = termFrequencyWeight(1);

  assert.ok(tenMentions > oneMention);
  assert.ok(tenMentions < 10 * oneMention);
});

test("a word in fewer files is worth more", () => {
  const documentCount = 3;
  const rare = inverseDocumentFrequency(1, documentCount);
  const common = inverseDocumentFrequency(documentCount, documentCount);

  assert.ok(rare > common);
});

test("a word in every file is still worth something", () => {
  assert.equal(inverseDocumentFrequency(3, 3), Math.log(2));
});

test("a term's score is just the two weights multiplied", () => {
  const occurrences = 4;
  const documentFrequency = 1;
  const documentCount = 3;

  assert.equal(
    termScore(occurrences, documentFrequency, documentCount),
    termFrequencyWeight(occurrences) *
      inverseDocumentFrequency(documentFrequency, documentCount),
  );
});
