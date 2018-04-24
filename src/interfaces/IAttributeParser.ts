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
  args: IFormatterArgument[];
}

export type IFormatterArgument = IFormatterPathArgument | IFormatterPrimitiveArgument

export interface IFormatterPathArgument {
  type: "path";
  value: string;
}

export interface IFormatterPrimitiveArgument {
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
