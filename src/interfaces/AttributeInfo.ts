export interface AttributeInfo extends AttributeNameInfo, AttributeValueInfo {
  attrName: string;
  attrValue: string;
}

export interface AttributeNameInfo {
  prefix: string;
  directive: string;
  argument: string;
  modifiers: string[];
}

export interface AttributeValueInfo {
  value: Value;
  formatters: FormatterInfo[];
  watch: string[];
}

export type Value = PathValue | PrimitiveValue;

export interface PathValue {
  type: "path";
  value: string;
}

export interface PrimitiveValue {
  type: "primitive";
  value: string | number | boolean | null | undefined;
}

export interface FormatterInfo {
  name: string;
  arguments: Value[];
}
