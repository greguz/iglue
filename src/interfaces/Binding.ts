import { AttributeInfo } from "./AttributeInfo";

/**
 * Represents a bingind between DOM attribute and a target value
 */
export interface Binding extends Readonly<AttributeInfo> {
  /**
   * Currently bound context
   */
  readonly context: any;

  /**
   * Get current value
   */
  get(): any;

  /**
   * Update the bound value
   */
  set(value: any): void;
}
