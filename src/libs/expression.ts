import { Expression, FormatterInfo } from "../interfaces/Expression";
import { Target } from "../interfaces/Target";

import { captureRegExpGroup, captureRegExpGroups } from "../utils/language";

import { parseTargets } from "./targets";

function parseRootTarget(expression: string): Target {
  const text = captureRegExpGroup(/\s*([^\|\s<]+)/, expression) || "";
  const targets = parseTargets(text);

  if (targets.length <= 0) {
    throw new Error("Expected target");
  } else if (targets.length >= 2) {
    throw new Error("Unexpected targets");
  }

  return targets[0];
}

function parseFormatters(expression: string): FormatterInfo[] {
  return captureRegExpGroups(/\|([^<\|]+)/g, expression).map(text => {
    const targets = parseTargets(text);

    if (targets.length < 1) {
      throw new Error("Expected formatter name");
    } else if (targets[0].type !== "path") {
      throw new Error("Invalid formatter name");
    }

    return {
      name: targets[0].value as string,
      targets: targets.slice(1)
    };
  });
}

function parseWatchedPaths(expression: string): string[] {
  return captureRegExpGroups(
    /\S+/g,
    captureRegExpGroup(/<(.+)/, expression) || "",
    0
  );
}

export function parseExpression(expression: string): Expression {
  return {
    target: parseRootTarget(expression),
    formatters: parseFormatters(expression),
    watch: parseWatchedPaths(expression)
  };
}
