import { AttributeInfo } from "./AttributeInfo";
import { Context } from "./Context";

/**
 * Represents a bingind between DOM attribute and a target value
 */

export interface Binding extends Readonly<AttributeInfo> {
  /**
   * Bound DOM element
   */

  readonly el: HTMLElement;

  /**
   * Data context
   */

  readonly context: Context;

  /**
   * Get current value
   */

  get(): any;

  /**
   * Update the bound value
   */

  set(value: any): void;
}
