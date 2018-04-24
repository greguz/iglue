import { IDirective } from "./IDirective";

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
   * Watch for changes and notify
   */

  watch(): void;

  /**
   * Stop watching
   */

  ignore(): void;

  /**
   * Returns true while watching
   */

  isWatching(): boolean;

  /**
   * Bind this observer to directives
   */

  notify(directive: IDirective): void;

}
