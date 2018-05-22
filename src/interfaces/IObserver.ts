/**
 * Represents an observed value
 */

export interface IObserver {

  /**
   * Get the current value
   */

  get(): any;

  /**
   * Set the target value
   */

  set(value: any): void;

  /**
   * Register a change callback
   */

  notify(callback: IObserverCallback | null): void;

}

/**
 * Change value callback
 */

export type IObserverCallback = (newValue: any, oldValue: any) => void;
