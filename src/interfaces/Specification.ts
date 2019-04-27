export interface Specification<T = any> {
  /**
   * Default value
   */
  default?: T;
  /**
   * Reject null and undefined
   */
  required?: boolean;
  /**
   * Type constructor
   */
  type?: Function | Function[];
  /**
   * Custom validation function
   */
  validator?: (value: any) => value is T;
}
