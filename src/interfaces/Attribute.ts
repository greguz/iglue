import { Expression } from "./Expression";

export interface Attribute {
  /**
   * DOM attribute name
   */
  name: string;
  /**
   * DOM attribute value
   */
  value: string;
  /**
   * Directive name
   */
  directive: string;
  /**
   * Directive's argument
   */
  argument?: string;
  /**
   * Modifiers list
   */
  modifiers: string[];
  /**
   * Parsed attribute value
   */
  expression: Expression;
}
