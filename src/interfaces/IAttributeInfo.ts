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

export interface IFormatterArgument {
  type: "path" | "primitive";
  value: any;
}

export interface IAttributeInfo extends IAttributeNameInfo, IAttributeValueInfo {
  attrName: string;
  attrValue: string;
}
