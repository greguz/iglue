export type ContextCallback = (newValue: any, oldValue: any) => void;

/**
 * Observed data object
 */
export interface Context {
  /**
   * Source data object to observe
   */
  $source: any;
  /**
   * Context's own properties (properties that does not exist inside $source)
   */
  $own: string[];
  /**
   * Observe value changes by path
   */
  $observe(path: string, callback: ContextCallback): void;
  /**
   * Stop value changes observing
   */
  $unobserve(path: string, callback: ContextCallback): void;
  /**
   * Properties inherit from $source object
   */
  [property: string]: any;
}
