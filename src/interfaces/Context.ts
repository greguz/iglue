import { Observer, ObserverCallback } from "./Observer";

/**
 * The observed data object
 */

export interface Context {

  /**
   * Source object for this context
   */

  $source: Partial<Context>;

  /**
   * Context own properties
   */

  $own: string[];

  /**
   * Observe a context path value
   */

  $observe(path: string, callback: ObserverCallback): Observer;

  /**
   * Any other property
   */

  [property: string]: any;

}
