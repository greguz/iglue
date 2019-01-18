export interface AttributeInfo extends AttributeNameInfo, AttributeValueInfo {
  /**
   * Original attribute name
   */
  attrName: string;

  /**
   * Original attribute value
   */
  attrValue: string;
}

export interface AttributeNameInfo {
  /**
   * Directive name
   */
  directive: string;

  /**
   * Possible static argument
   */
  argument?: string;

  /**
   * Modifiers (currently not used)
   */
  modifiers: string[];
}

export interface AttributeValueInfo {
  /**
   * Directive argument, may be a path or a static value
   */
  value: Value;

  /**
   * Applied formatters
   */
  formatters: FormatterInfo[];

  /**
   * Paths to watch
   */
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
