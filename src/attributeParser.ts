import { IAttributeParser, IAttributeInfo, IAttributeNameInfo, IAttributeValueInfo } from "./interfaces/IAttributeParser";

function buildDirectiveParser(prefix: string): (attrName: string) => string {
  const regex = new RegExp("^" + prefix + "([^:\.]+)");

  return function parseDirective(attrName: string): string {
    const match = attrName.match(regex);

    if (match) {
      return match[1];
    } else {
      throw new Error(`The attribute name "${attrName}" does not match with prefix "${prefix}"`);
    }
  }
}

function parseArgument(attrName: string): string {
  const match = attrName.match(/:([^\.]+)/);

  if (match) {
    return match[1];
  } else {
    return null;
  }
}

function parseModifiers(attrName: string): string[] {
  const regex = /\.([^\.]+)/g;
  const modifiers: string[] = [];

  let match: any;
  while (match = regex.exec(attrName)) {
    modifiers.push(match[1]);
  }

  return modifiers;
}

function parsePath(attrValue: string): string {
  const match = attrValue.match(/\s*([^\|\s]+)/);

  if (match) {
    return match[1];
  } else {
    throw new Error("The directive does not contains a target path");
  }
}

function parseFormatter(attrValue: string): string {
  const match = attrValue.match(/\|\s*([^\s]+)/);

  if (match) {
    return match[1];
  } else {
    return null;
  }
}

export function buildAttributeParser(prefix: string): IAttributeParser {
  const parseDirective = buildDirectiveParser(prefix);

  function parseName(attrName: string): IAttributeNameInfo {
    return {
      prefix,
      directive: parseDirective(attrName),
      arg: parseArgument(attrName),
      modifiers: parseModifiers(attrName)
    };
  }

  function parseValue(attrValue: string): IAttributeValueInfo {
    return {
      path: parsePath(attrValue),
      formatter: parseFormatter(attrValue),
      args: [] // TODO formatter arguments
    };
  }

  function parse(el: HTMLElement, attrName: string): IAttributeInfo {
    const attrValue: string = el.getAttribute(attrName);

    return {
      attrName,
      attrValue,
      prefix,
      directive: parseDirective(attrName),
      arg: parseArgument(attrName),
      modifiers: parseModifiers(attrName),
      path: parsePath(attrValue),
      formatter: parseFormatter(attrValue),
      args: [] // TODO formatter arguments
    };
  }

  function hasDirective(el: HTMLElement, directive: string): boolean {
    for (let i = 0; i < el.attributes.length; i++) {
      if (directive === parseDirective(el.attributes[i].name)) {
        return true;
      }
    }
    return false;
  }

  return {
    parseName,
    parseValue,
    parse,
    hasDirective
  };
}
