import { Attribute } from "../interfaces/Attribute";

import { getAttributes } from "../utils/dom";
import { captureRegExpGroup, captureRegExpGroups } from "../utils/language";

import { parseExpression } from "./expression";

export function parseDirective(attrName: string) {
  return captureRegExpGroup(/^i-([^:.]+)/, attrName);
}

export function parseArgument(attrName: string) {
  return captureRegExpGroup(/:([^\.]+)/, attrName);
}

export function parseModifiers(attrName: string) {
  return captureRegExpGroups(/\.([^\.]+)/g, attrName);
}

export function parseAttribute(el: HTMLElement, attrName: string): Attribute {
  const directive = parseDirective(attrName);
  if (!directive) {
    throw new Error("Unexpected attribute name");
  }

  const attrValue = el.getAttribute(attrName) || "";
  return {
    name: attrName,
    value: attrValue,
    directive,
    argument: parseArgument(attrName),
    modifiers: parseModifiers(attrName),
    expression: parseExpression(attrValue)
  };
}

export function parseAttributes(el: HTMLElement) {
  return getAttributes(el)
    .map(attr => attr.name)
    .filter(attrName => !!parseDirective(attrName))
    .map(attrName => parseAttribute(el, attrName));
}
