/**
 * Represents an observed value
 */

export interface Observer {

  /**
   * Get the current value
   */

  get(): any;

  /**
   * Set the target value
   */

  set(value: any): void;

  /**
   * Stop observe value
   */

  unobserve(): void;

}

/**
 * Value change callback
 */

export type ObserverCallback = (newValue: any, oldValue: any) => void;
