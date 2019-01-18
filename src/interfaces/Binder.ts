import { Binding } from "./Binding";
import { Specification } from "./Specification";

/**
 * Binder configuration
 */
export interface Binder<T = any> {
  /**
   * Enforce binding argument
   */
  argumentRequired?: boolean;

  /**
   * Bound value specifications
   */
  value?: Specification<T>;

  /**
   * Triggered when the binding is created
   */
  bind?: (el: HTMLElement, binding: Binding) => void;

  /**
   * Triggered when the watched value changes
   */
  routine?: BinderRoutine<T>;

  /**
   * Triggered when the binding is destroyed
   */
  unbind?: (el: HTMLElement, binding: Binding) => void;
}

/**
 * Binder routine function
 */

export type BinderRoutine<T = any> = (
  el: HTMLElement,
  value: T,
  binding: Binding
) => void;
