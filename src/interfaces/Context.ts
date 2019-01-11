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
   * Observe a specified path
   */

  $observe(
    path: string,
    callback: (newValue: any, oldValue: any) => void
  ): void;

  /**
   * Stop path observing
   */

  $unobserve(
    path: string,
    callback: (newValue: any, oldValue: any) => void
  ): void;

  /**
   * Any other property
   */

  [property: string]: any;
}
