/**
 * Represents an observed value
 */

export interface IObserver {

  /**
   * Get the current value
   */

  get(): any;

  /**
   * Set the value
   */

  set(value: any): void;

  /**
   * Register a change callback
   */

  notify(callback: () => void): void;

}
