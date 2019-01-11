import { Binding } from "./Binding";
import { Specification } from "./Specification";

/**
 * Binder configuration
 */

export interface Binder<T = any, V = any> {
  /**
   * Enforce binding argument
   */

  argumentRequired?: boolean;

  /**
   * Bound value specifications
   */

  value?: Specification<V>;

  /**
   * Triggered when the binding is created
   */

  bind?: (this: T, el: HTMLElement, binding: Binding) => void;

  /**
   * Triggered when the watched value changes
   */

  routine?: BinderRoutine<T, V>;

  /**
   * Triggered when the binding is destroyed
   */

  unbind?: (this: T, el: HTMLElement, binding: Binding) => void;
}

/**
 * Binder routine function
 */

export type BinderRoutine<T = any, V = any> = (
  this: T,
  el: HTMLElement,
  value: V,
  binding: Binding
) => void;
