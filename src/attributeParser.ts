import {
  IAttributeInfo,
  IAttributeNameInfo,
  IAttributeParser,
  IAttributeValueInfo,
  IFormatterArgument,
  IFormatterPathArgument,
  IFormatterPrimitiveArgument
} from "./interfaces/IAttributeParser";

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

function parsePath(attrValue: string): string {
  return getRegExpGroup(
    attrValue,
    /\s*([^\|\s]+)/,
    1,
    "The directive does not contains a target path"
  );
}

function parseFormatter(attrValue: string): string | null {
  return getRegExpGroup(attrValue, /\|\s*([^\s]+)/, 1);
}

function buildPathArgument(value: string): IFormatterPathArgument {
  return { type: "path", value };
}

function buildPrimitiveArgument(value: string | number | boolean | null | undefined): IFormatterPrimitiveArgument {
  return { type: "primitive", value };
}

function parseFormatterArguments(attrValue: string): IFormatterArgument[] {
  const matches: string[] = attrValue.match(/\S+/g) || [];

  return matches.slice(2).map((value: string): IFormatterArgument => {
    if (value === "undefined") {
      return buildPrimitiveArgument(undefined);
    } else if (value === "null") {
      return buildPrimitiveArgument(null);
    } else if (value === "true") {
      return buildPrimitiveArgument(true);
    } else if (value === "false") {
      return buildPrimitiveArgument(false);
    } else if (/^-?\d+\.?\d*$/.test(value)) {
      return buildPrimitiveArgument(parseFloat(value));
    } else if (/^".*"$/.test(value) || /^ '.*'$ /.test(value)) {
      return buildPrimitiveArgument(JSON.parse(value));
    } else {
      return buildPathArgument(value);
    }
  });
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

  function parseName(attrName: string): IAttributeNameInfo {
    return {
      prefix,
      directive: parseDirective(attrName, `The attribute name "${attrName}" does not match with prefix "${prefix}"`),
      arg: parseArgument(attrName),
      modifiers: parseModifiers(attrName)
    };
  }

  function parseValue(attrValue: string): IAttributeValueInfo {
    return {
      path: parsePath(attrValue),
      formatter: parseFormatter(attrValue),
      args: parseFormatterArguments(attrValue)
    };
  }

  function parse(el: HTMLElement, attrName: string): IAttributeInfo {
    const attrValue: string = el.getAttribute(attrName);

    return {
      attrName,
      attrValue,
      prefix,
      directive: parseDirective(attrName, `The attribute name "${attrName}" does not match with prefix "${prefix}"`),
      arg: parseArgument(attrName),
      modifiers: parseModifiers(attrName),
      path: parsePath(attrValue),
      formatter: parseFormatter(attrValue),
      args: parseFormatterArguments(attrValue)
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
    parseName,
    parseValue,
    parse,
    getAttributeByDirective
  };
}
