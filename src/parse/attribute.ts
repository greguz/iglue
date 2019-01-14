import {
  AttributeInfo,
  AttributeNameInfo,
  AttributeValueInfo,
  FormatterInfo,
  PathValue,
  PrimitiveValue,
  Value
} from "../interfaces/AttributeInfo";

function getRegExpGroup(
  str: string,
  regex: RegExp,
  group: number
): string | undefined;
function getRegExpGroup(
  str: string,
  regex: RegExp,
  group: number,
  err: string
): string;
function getRegExpGroup(
  str: string,
  regex: RegExp,
  group: number,
  err?: string | undefined
): string | undefined {
  const match = str.match(regex);
  if (match) {
    if (typeof match[group] === "string") {
      return match[group];
    }
  }
  if (err) {
    throw new Error(err);
  }
}

function parseArgument(attrName: string): string | undefined {
  return getRegExpGroup(attrName, /:([^\.]+)/, 1);
}

function parseModifiers(attrName: string): string[] {
  const match = attrName.match(/\.([^\.]+)/g);
  if (match) {
    return match.map((str: string): string => str.substr(1));
  } else {
    return [];
  }
}

function buildPathValue(value: string): PathValue {
  return { type: "path", value };
}

function buildPrimitiveValue(
  value: string | number | boolean | null | undefined
): PrimitiveValue {
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
  return getRegExpGroup(chunk, /(\S+)/, 1, "Empty formatter found");
}

function parseFormatterArguments(chunk: string): Value[] {
  return (chunk.match(/(\S+)/g) || []).slice(1).map(parseValue);
}

function parseFormatters(attrValue: string): FormatterInfo[] {
  const definition = getRegExpGroup(attrValue, /\|([^<]+)/, 1);
  if (!definition) {
    return [];
  }
  return definition.split("|").map(
    (chunk: string): FormatterInfo => {
      return {
        name: parseFormatterName(chunk),
        arguments: parseFormatterArguments(chunk)
      };
    }
  );
}

function parseWatchedPaths(attrValue: string): string[] {
  const definition = getRegExpGroup(attrValue, /<(.+)/, 1);
  return definition ? definition.match(/\S+/g) || [] : [];
}

/**
 * TODO: docs
 */
export function getPrefixRegExp(prefix: string | RegExp) {
  if (typeof prefix === "string") {
    return new RegExp("^" + prefix + "([^:.]+)");
  } else {
    return prefix;
  }
}

/**
 * TODO: docs
 */
export function parseAttributeName(
  prefix: string | RegExp,
  attrName: string
): AttributeNameInfo {
  return {
    directive: getRegExpGroup(
      attrName,
      getPrefixRegExp(prefix),
      1,
      `The attribute name "${attrName}" does not match with prefix "${prefix}"`
    ),
    argument: parseArgument(attrName),
    modifiers: parseModifiers(attrName)
  };
}

/**
 * TODO: docs
 */
export function parseAttributeValue(attrValue: string): AttributeValueInfo {
  return {
    value: parseRootValue(attrValue),
    formatters: parseFormatters(attrValue),
    watch: parseWatchedPaths(attrValue)
  };
}

/**
 * TODO: docs
 */
export function parseAttribute(
  prefix: string | RegExp,
  el: HTMLElement,
  attrName: string
): AttributeInfo {
  const attrValue = el.getAttribute(attrName);
  if (!attrValue) {
    throw new Error();
  }
  return {
    attrName,
    ...parseAttributeName(prefix, attrName),
    attrValue,
    ...parseAttributeValue(attrValue)
  };
}

/**
 * TODO: docs
 */
export function getAttributeByDirective(
  prefix: string | RegExp,
  el: HTMLElement,
  directive: string
): string | undefined {
  for (let i = 0; i < el.attributes.length; i++) {
    if (
      directive ===
      getRegExpGroup(el.attributes[i].name, getPrefixRegExp(prefix), 1)
    ) {
      return el.attributes[i].name;
    }
  }
}

/**
 * TODO: docs
 */
export function matchPrefix(
  prefix: string | RegExp,
  attrName: string
): boolean {
  return getPrefixRegExp(prefix).test(attrName);
}
