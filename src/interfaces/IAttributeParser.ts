export interface IAttributeNameInfo {
  prefix: string;
  directive: string;
  argument: string;
  modifiers: string[];
}

export interface IAttributeValueInfo {
  value: ITarget;
  formatters: IFormatterInfo[];
}

export interface IFormatterInfo {
  name: string;
  arguments: ITarget[];
}

export type ITarget = IPathTarget | IPrimitiveTarget;

export interface IPathTarget {
  type: "path";
  value: string;
}

export interface IPrimitiveTarget {
  type: "primitive";
  value: string | number | boolean | null | undefined;
}

export interface IAttributeInfo extends IAttributeNameInfo, IAttributeValueInfo {
  attrName: string;
  attrValue: string;
}

export interface IAttributeParser {
  match: (attrName: string) => boolean;
  parseName: (attrName: string) => IAttributeNameInfo;
  parseValue: (attrValue: string) => IAttributeValueInfo;
  parse: (el: HTMLElement, attrName: string) => IAttributeInfo;
  getAttributeByDirective: (el: HTMLElement, directive: string) => string;
}
