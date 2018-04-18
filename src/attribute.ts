// i-on:click.prevent.throttle="component.onClick"
//   "i-" is the prefix
//   "on" is the directive name
//   "click" is the directive argument (arg)
//   "prevent" and "throttle" are modifiers
//   "component.onClick" is the value path

// i-value="component.date | date 'YYYY MM DD'"
//   "component.data" is the value path
//   "date" is the formatter
//   'YYYY MM DD' TODO

export interface IAttributeNameInfo {
  prefix: string;
  directive: string;
  arg: string;
  modifiers: string[];
}

export interface IAttributeValueInfo {
  path: string;
  formatter: string;
  // TODO formatter arguments
}

export interface IAttributeInfo extends IAttributeNameInfo, IAttributeValueInfo {
  attrName: string;
  attrValue: string;
}

function parseDirective(attrName: string, prefix: string): string {
  const regex = new RegExp("^" + prefix + "([^:\.]+)");
  if (regex.test(attrName)) {
    return attrName.match(regex)[1];
  } else {
    throw new Error(`The attribute name "${attrName}" does not match with prefix "${prefix}"`);
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

export function parseAttributeName(attrName: string, prefix?: string): IAttributeNameInfo {
  prefix = prefix || "";
  return {
    prefix,
    directive: parseDirective(attrName, prefix),
    arg: parseArgument(attrName),
    modifiers: parseModifiers(attrName)
  };
}

export function parseAttributeValue(attrValue: string): IAttributeValueInfo {
  return {
    path: parsePath(attrValue),
    formatter: parseFormatter(attrValue)
  };
}

export function parseAttribute(el: HTMLElement, attrName: string, prefix?: string): IAttributeInfo {
  const attrValue: string = el.getAttribute(attrName);

  const nameInfo = parseAttributeName(attrName, prefix);
  const valueInfo = parseAttributeValue(attrValue);

  return {
    attrName,
    attrValue,
    prefix: nameInfo.prefix,
    directive: nameInfo.directive,
    arg: nameInfo.arg,
    modifiers: nameInfo.modifiers,
    path: valueInfo.path,
    formatter: valueInfo.formatter
  };
}

export function buildAttributeNameMatcher(prefix: string): (attrName: string) => boolean {
  const reg: RegExp = new RegExp('^' + prefix);
  return function match(attrName: string): boolean {
    return reg.test(attrName);
  };
}
