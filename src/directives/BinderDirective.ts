import { Directive } from "../Directive";

/**
 * Generic context per binding
 */

export interface OneWayBinderContext { [key: string]: any; }

/**
 * Simple one-way data binder, just update the DOM when the model changes
 */

export type OneWayBinder<T> = (this: OneWayBinderContext, el: HTMLElement, value: T) => void;

/**
 * Two way data binding context
 */

export interface TwoWayBinderContext<T> extends OneWayBinderContext {

  /**
   * Function to update the model
   */

  readonly publish: (value: T) => void;

}

/**
 * Two way data binder
 */

export interface TwoWayBinder<T> {

  /**
   * Called when the binding is initialized
   */

  bind?: (this: TwoWayBinderContext<T>, el: HTMLElement) => void;

  /**
   * Called when there"s a model update
   */

  routine?: (this: TwoWayBinderContext<T>, el: HTMLElement, value: T) => void;

  /**
   * Called on binding death
   */

  unbind?: (this: TwoWayBinderContext<T>, el: HTMLElement) => void;

}

/**
 * All binder types
 */

export type Binder<T> = OneWayBinder<T> | TwoWayBinder<T>;

/**
 * Build the default binder
 */

function buildDefaultBinder(attrName: string): Binder<any> {
  return function bindAttributeValue(el: HTMLElement, value: any): void {
    if (value == null) {
      el.removeAttribute(attrName);
    } else {
      el.setAttribute(attrName, value.toString());
    }
  };
}

/**
 * Handle the binder lifecycle
 */

export class BinderDirective implements Directive {

  /**
   * Bound node to this binding
   */

  public readonly node: HTMLElement;

  /**
   * Bound attribute name
   */

  public readonly attributeName: string;

  /**
   * Bound attribute value
   */

  public readonly attributeValue: string;

  /**
   * Bound model value path
   */

  public path: string;

  /**
   * Normalized binder
   */

  private binder: TwoWayBinder<any>;

  /**
   * Current binding context
   */

  private context: TwoWayBinderContext<any>;

  /**
   * @constructor
   */

  constructor(node: HTMLElement, attrName: string, binder?: Binder<any>) {
    this.node = node;
    this.attributeName = attrName;
    this.attributeValue = node.getAttribute(attrName);
    this.path = this.attributeValue;

    if (binder == null) {
      binder = buildDefaultBinder(attrName);
    }

    if (typeof binder === "function") {
      this.binder = { routine: binder };
    } else {
      this.binder = binder;
    }
  }

  /**
   * Create a new context and start the binding with the DOM
   */

  public bind(publish: (value: any) => void): void {
    if (this.context) {
      throw new Error("Binding is active");
    }

    this.context = { publish };

    this.node.removeAttribute(this.attributeName);

    if (this.binder.bind) {
      this.binder.bind.call(this.context, this.node);
    }
  }

  /**
   * Write a value to the DOM
   */

  public write(value: any): void {
    if (!this.context) {
      throw new Error("Binding is not active");
    }

    if (this.binder.routine) {
      this.binder.routine.call(this.context, this.node, value);
    }
  }

  /**
   * Stop DOM listening and reset the context
   */

  public unbind(): void {
    if (!this.context) {
      throw new Error("Binding is not active");
    }

    if (this.binder.unbind) {
      this.binder.unbind.call(this.context, this.node);
    }

    this.context = undefined;

    this.node.setAttribute(this.attributeName, this.attributeValue);
  }

}
