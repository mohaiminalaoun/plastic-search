import { type SearchOperator } from "./search-index.ts";

export interface ParsedSearchArguments {
  operator: SearchOperator;
  queryTerms: string[];
}

// Pull the operator out of the command-line arguments and leave the remaining
// values as query terms. Searches use AND when no operator is provided.
export function parseSearchArguments(args: string[]): ParsedSearchArguments {
  let operator: SearchOperator = "and";
  let foundOperator = false;
  const queryTerms: string[] = [];

  for (const argument of args) {
    if (!argument.startsWith("--operator=")) {
      queryTerms.push(argument);
      continue;
    }

    if (foundOperator) {
      throw new Error("Only one --operator flag is allowed.");
    }

    const operatorValue = argument.slice("--operator=".length).toLowerCase();

    if (operatorValue !== "and" && operatorValue !== "or") {
      throw new Error('Operator must be either "and" or "or".');
    }

    operator = operatorValue;
    foundOperator = true;
  }

  if (foundOperator && queryTerms.length === 0) {
    throw new Error("The --operator flag needs at least one query term.");
  }

  return { operator, queryTerms };
}
