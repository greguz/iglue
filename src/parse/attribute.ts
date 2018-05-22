import {
  IAttributeInfo,
  IAttributeNameInfo,
  IAttributeParser,
  IAttributeValueInfo,
  IFormatterInfo,
  IPathTarget,
  IPrimitiveTarget,
  ITarget
} from "../interfaces/IAttributeParser";

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

function buildPathTarget(value: string): IPathTarget {
  return { type: "path", value };
}

function buildPrimitiveTarget(value: string | number | boolean | null | undefined): IPrimitiveTarget {
  return { type: "primitive", value };
}

function parseTarget(value: string): ITarget {
  if (value === "undefined") {
    return buildPrimitiveTarget(undefined);
  } else if (value === "null") {
    return buildPrimitiveTarget(null);
  } else if (value === "true") {
    return buildPrimitiveTarget(true);
  } else if (value === "false") {
    return buildPrimitiveTarget(false);
  } else if (/^-?\d+\.?\d*$/.test(value)) {
    return buildPrimitiveTarget(parseFloat(value));
  } else if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
    return buildPrimitiveTarget(value.substring(1, value.length - 1));
  } else {
    return buildPathTarget(value);
  }
}

function parseValue(attrValue: string): ITarget {
  return parseTarget(
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

function parseFormatterArguments(chunk: string): ITarget[] {
  return chunk
    .match(/(\S+)/g)
    .slice(1)
    .map(parseTarget);
}

function parseFormatters(attrValue: string): IFormatterInfo[] {
  const definition: string = getRegExpGroup(attrValue, /\|([^<]+)/, 1);
  if (!definition) {
    return [];
  }
  return definition.split("|").map((chunk: string): IFormatterInfo => {
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

export function buildAttributeParser(prefix: string): IAttributeParser {
  const regex = new RegExp("^" + prefix + "([^:\.]+)");

  function parseDirective(attrName: string, err?: string): string {
    return getRegExpGroup(
      attrName,
      regex,
      1,
      err
    );
  }

  function parseAttributeName(attrName: string): IAttributeNameInfo {
    return {
      prefix,
      directive: parseDirective(attrName, `The attribute name "${attrName}" does not match with prefix "${prefix}"`),
      argument: parseArgument(attrName),
      modifiers: parseModifiers(attrName)
    };
  }

  function parseAttributeValue(attrValue: string): IAttributeValueInfo {
    return {
      value: parseValue(attrValue),
      formatters: parseFormatters(attrValue),
      watch: parseWatchedPaths(attrValue)
    };
  }

  function parse(el: HTMLElement, attrName: string): IAttributeInfo {
    const attrValue: string = el.getAttribute(attrName);

    return {
      attrName,
      attrValue,
      prefix,
      directive: parseDirective(attrName, `The attribute name "${attrName}" does not match with prefix "${prefix}"`),
      argument: parseArgument(attrName),
      modifiers: parseModifiers(attrName),
      value: parseValue(attrValue),
      formatters: parseFormatters(attrValue),
      watch: parseWatchedPaths(attrValue)
    };
  }

  function getAttributeByDirective(el: HTMLElement, directive: string): string | null {
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
