import { Attribute, Name } from "../interfaces/Attribute";
import { Expression, FormatterInfo } from "../interfaces/Expression";
import { Target } from "../interfaces/Target";

import { parseTargets } from "../parse/targets";

import { getAttributes } from "../utils/dom";
import { captureRegExpGroup, captureRegExpGroups } from "../utils/language";

export function parseDirective(attrName: string) {
  return captureRegExpGroup(/^i-([^:.]+)/, attrName);
}

export function parseArgument(attrName: string): string | undefined {
  return captureRegExpGroup(/:([^\.]+)/, attrName);
}

export function parseModifiers(attrName: string): string[] {
  return captureRegExpGroups(/\.([^\.]+)/g, attrName);
}

export function parseRootTarget(attrValue: string): Target {
  const text = captureRegExpGroup(/\s*([^\|\s<]+)/, attrValue) || "";
  const targets = parseTargets(text);

  if (targets.length <= 0) {
    throw new Error("Expected target");
  } else if (targets.length >= 2) {
    throw new Error("Unexpected targets");
  }

  return targets[0];
}

export function parseFormatters(attrValue: string): FormatterInfo[] {
  return captureRegExpGroups(/\|([^<\|]+)/g, attrValue).map(text => {
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

export function parseWatchedPaths(attrValue: string): string[] {
  const text = captureRegExpGroup(/<(.+)/, attrValue) || "";
  return captureRegExpGroups(/\S+/g, text, 0);
}

export function parseAttributeName(attrName: string): Name {
  const directive = parseDirective(attrName);
  if (!directive) {
    throw new Error("Unexpected attribute name");
  }

  return {
    directive,
    argument: parseArgument(attrName),
    modifiers: parseModifiers(attrName)
  };
}

export function parseAttributeValue(attrValue: string): Expression {
  return {
    target: parseRootTarget(attrValue),
    formatters: parseFormatters(attrValue),
    watch: parseWatchedPaths(attrValue)
  };
}

export function parseAttribute(el: HTMLElement, attrName: string): Attribute {
  const attrValue = el.getAttribute(attrName) || "";

  return {
    name: attrName,
    value: attrValue,
    ...parseAttributeName(attrName),
    ...parseAttributeValue(attrValue)
  };
}

export function parseAttributes(el: HTMLElement) {
  return getAttributes(el)
    .map(attr => attr.name)
    .filter(attrName => !!parseDirective(attrName))
    .map(attrName => parseAttribute(el, attrName));
}
