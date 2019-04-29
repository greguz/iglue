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
  bind?: (this: any, el: HTMLElement, binding: Binding) => void;
  /**
   * Triggered when the target value changes
   */
  routine?: BinderRoutine<T>;
  /**
   * Triggered when the binding is destroyed
   */
  unbind?: (this: any, el: HTMLElement, binding: Binding) => void;
}

/**
 * Triggered when the target value changes
 */
export type BinderRoutine<T = any> = (
  this: any,
  el: HTMLElement,
  value: T,
  binding: Binding
) => void;
