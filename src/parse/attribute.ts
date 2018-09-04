import {
  AttributeInfo,
  AttributeNameInfo,
  AttributeValueInfo,
  FormatterInfo,
  PathValue,
  PrimitiveValue,
  Value
} from "../interfaces/AttributeInfo";

import { AttributeParser } from "../interfaces/AttributeParser";

function getRegExpGroup(str: string, regex: RegExp, group: number, err?: string): string | null {
  const match: RegExpMatchArray = str.match(regex);

  if (match) {
    if (typeof match[group] === "string") {
      return match[group];
    }
  }

  if (err) {
    throw new Error(err);
  } else {
    return null;
  }
}

function parseArgument(attrName: string): string | null {
  return getRegExpGroup(attrName, /:([^\.]+)/, 1);
}

function parseModifiers(attrName: string): string[] {
  const match: RegExpMatchArray = attrName.match(/\.([^\.]+)/g);

  if (match) {
    return match.map((str: string): string => str.substr(1));
  } else {
    return [];
  }
}

function buildPathValue(value: string): PathValue {
  return { type: "path", value };
}

function buildPrimitiveValue(value: string | number | boolean | null | undefined): PrimitiveValue {
  return { type: "primitive", value };
}

function parseValue(value: string): Value {
  if (value === "undefined") {
    return buildPrimitiveValue(undefined);
  } else if (value === "null") {
    return buildPrimitiveValue(null);
  } else if (value === "true") {
    return buildPrimitiveValue(true);
  } else if (value === "false") {
    return buildPrimitiveValue(false);
  } else if (/^-?\d+\.?\d*$/.test(value)) {
    return buildPrimitiveValue(parseFloat(value));
  } else if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
    return buildPrimitiveValue(value.substring(1, value.length - 1));
  } else {
    return buildPathValue(value);
  }
}

function parseRootValue(attrValue: string): Value {
  return parseValue(
    getRegExpGroup(
      attrValue,
      /\s*([^\|\s<]+)/,
      1,
      "The directive does not target a value"
    )
  );
}

function parseFormatterName(chunk: string): string {
  return getRegExpGroup(
    chunk,
    /(\S+)/,
    1,
    "Empty formatter found"
  );
}

function parseFormatterArguments(chunk: string): Value[] {
  return chunk
    .match(/(\S+)/g)
    .slice(1)
    .map(parseValue);
}

function parseFormatters(attrValue: string): FormatterInfo[] {
  const definition: string = getRegExpGroup(attrValue, /\|([^<]+)/, 1);
  if (!definition) {
    return [];
  }
  return definition.split("|").map((chunk: string): FormatterInfo => {
    return {
      name: parseFormatterName(chunk),
      arguments: parseFormatterArguments(chunk)
    };
  });
}

function parseWatchedPaths(attrValue: string): string[] {
  const definition: string = getRegExpGroup(attrValue, /<(.+)/, 1);
  if (definition) {
    return definition.match(/\S+/g);
  } else {
    return [];
  }
}

export function buildAttributeParser(prefix: string): AttributeParser {
  const regex = new RegExp("^" + prefix + "([^:\.]+)");

  function parseDirective(attrName: string, err?: string): string {
    return getRegExpGroup(
      attrName,
      regex,
      1,
      err
    );
  }

  function parseAttributeName(attrName: string): AttributeNameInfo {
    return {
      prefix,
      directive: parseDirective(attrName, `The attribute name "${attrName}" does not match with prefix "${prefix}"`),
      argument: parseArgument(attrName),
      modifiers: parseModifiers(attrName)
    };
  }

  function parseAttributeValue(attrValue: string): AttributeValueInfo {
    return {
      value: parseRootValue(attrValue),
      formatters: parseFormatters(attrValue),
      watch: parseWatchedPaths(attrValue)
    };
  }

  function parse(el: HTMLElement, attrName: string): AttributeInfo {
    const attrValue: string = el.getAttribute(attrName);

    return {
      attrName,
      attrValue,
      prefix,
      directive: parseDirective(attrName, `The attribute name "${attrName}" does not match with prefix "${prefix}"`),
      argument: parseArgument(attrName),
      modifiers: parseModifiers(attrName),
      value: parseRootValue(attrValue),
      formatters: parseFormatters(attrValue),
      watch: parseWatchedPaths(attrValue)
    };
  }

  function getAttributeByDirective(el: HTMLElement, directive: string): string {
    for (let i = 0; i < el.attributes.length; i++) {
      if (directive === parseDirective(el.attributes[i].name)) {
        return el.attributes[i].name;
      }
    }
    return null;
  }

  function match(attrName: string): boolean {
    return regex.test(attrName);
  }

  return {
    match,
    parseName: parseAttributeName,
    parseValue: parseAttributeValue,
    parse,
    getAttributeByDirective
  };
}
