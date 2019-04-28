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
   * 1. Data is available
   */
  create?(this: T): void;
  /**
   * 2. Reactivity and DOM is ready
   */
  bind?(this: T): void;
  /**
   * 3. Attached into DOM
   */
  attach?(this: T): void;
  /**
   * 4. Detached from DOM
   */
  detach?(this: T): void;
  /**
   * 5. DOM uninitialized
   */
  unbind?(this: T): void;
  /**
   * 6. Data is still here
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
