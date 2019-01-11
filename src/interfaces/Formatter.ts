/**
 * Represents a template formatting mode
 */

export interface Formatter {
  /**
   * Map the value when it is extracted from the store
   */

  pull?: FormatterFunction;

  /**
   * Map the value before store update
   */

  push?: FormatterFunction;
}

/**
 * Formatter mapping function
 */

export type FormatterFunction = (value: any, ...args: any[]) => any;
