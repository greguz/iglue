import { Collection, Getter, Setter } from "../utils/type";

export interface Component<T = any> {
  /**
   * Build default component data
   */
  data?(this: null): object;
  /**
   * HTML template string
   */
  template?: string;
  /**
   * Custom rendering function
   */
  render?(this: T): HTMLElement;
  /**
   * 1. Data is ready and reactive
   */
  create?(this: T): void;
  /**
   * 2. Component DOM element is ready, but not inside the document
   */
  bind?(this: T): void;
  /**
   * 3. Component is attached to the document
   */
  attach?(this: T): void;
  /**
   * 4. Triggered while the component is still inside the document
   */
  detach?(this: T): void;
  /**
   * 5. Triggered while the component DOM elements are still present
   */
  unbind?(this: T): void;
  /**
   * 6. Triggered while the component data is still usable
   */
  destroy?(this: T): void;
  /**
   * Component methods
   */
  methods?: Collection<Method<T>>;
  /**
   * Computed properties
   */
  computed?: Collection<Getter<any, T> | ComputedProperty<any, T>>;
  /**
   * Watch handlers
   */
  watch?: Collection<WatchHandler<T>>;
}

export type Method<T = any> = (this: T, ...args: any[]) => any;

export interface ComputedProperty<T = any, C = any> {
  get: Getter<T, C>;
  set: Setter<T, C>;
}

export type WatchHandler<T = any> = (
  this: T,
  newValue: any,
  oldValue: any
) => any;
