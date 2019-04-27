import { Expression } from "./Expression";

/**
 * Parsed DOM attribute name and value
 */
export interface Attribute extends Name, Expression {
  name: string;
  value: string;
}

/**
 * Attribute name info (directive declaration)
 */
export interface Name {
  directive: string;
  argument?: string;
  modifiers: string[];
}
