import { Binding } from "./Binding";
import { Specification } from "./Specification";

export interface Binder<T = any> {
  /**
   * Enforce binding argument
   */
  argumentRequired?: boolean;
  /**
   * Value validation
   */
  value?: Specification<T>;
  /**
   * Triggered when the binding is created
   */
  bind?: (el: HTMLElement, binding: Binding) => void;
  /**
   * Triggered when the target value changes
   */
  routine?: BinderRoutine<T>;
  /**
   * Triggered when the binding is destroyed
   */
  unbind?: (el: HTMLElement, binding: Binding) => void;
}

/**
 * Triggered when the target value changes
 */
export type BinderRoutine<T = any> = (
  el: HTMLElement,
  value: T,
  binding: Binding
) => void;
