/**
 * Simple formatting/mapping function
 */

export type Formatter = (value: any, ...args: any[]) => any;

/**
 * Complete formatter object
 */

export interface IFormatter {

  /**
   * Called when the value is read from the source
   */

  pull: Formatter;

  /**
   * Fired when the value is saved to target
   */

  push: Formatter;

}
