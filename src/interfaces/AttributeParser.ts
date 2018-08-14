import { AttributeInfo, AttributeNameInfo, AttributeValueInfo } from "../interfaces/AttributeInfo";

/**
 * DOM attribute parser interface
 */

export interface AttributeParser {

  /**
   * Returns true when the attribute match with the configured prefix
   */

  match(attrName: string): boolean;

  /**
   * Extract attribute name info
   */

  parseName(attrName: string): AttributeNameInfo;

  /**
   * Extract attribute value info
   */

  parseValue(attrValue: string): AttributeValueInfo;

  /**
   * Extract all possible infos
   */

  parse(el: HTMLElement, attrName: string): AttributeInfo;

  /**
   * Get attribute by directive name
   */

  getAttributeByDirective(el: HTMLElement, directive: string): string;

}
