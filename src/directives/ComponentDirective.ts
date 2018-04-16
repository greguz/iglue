import { Directive } from "../Directive";
import { View, ViewOptions } from "../View";

/**
 * Component context
 */

export interface ComponentContext { [key: string]: any; }

/**
 * Component interface
 */

export interface Component {

  /**
   * The component HTML template
   */

  template: string;

  /**
   * Component loaded, data-binding and DOM not initialized
   */

  create?(this: ComponentContext): void;

  /**
   * DOM initialized, data-binding is not running
   */

  attach?(this: ComponentContext, el: HTMLElement): void;

  /**
   * Both DOM and data-binding are initialized
   */

  bind?(this: ComponentContext, view: View): void;

  /**
   * The data-binding and the DOM are still running
   */

  unbind?(this: ComponentContext, view: View): void;

  /**
   * The data-binding is stopped, the DOM is still untached
   */

  detach?(this: ComponentContext, el: HTMLElement): void;

  /**
   * Both data-biding and DOM are dead
   */

  destroy?(this: ComponentContext): void;

}

/**
 * Function that resolve a component name into a component object
 */

export type ResolveComponentName = (name: string) => Component;

/**
 * Directive that manages the component lifecycle
 */

export class ComponentDirective implements Directive {

  /**
   * Observed path, the component name
   */

  public readonly path: string;

  /**
   * The parent DOM node of this component
   */

  private parentNode: HTMLElement;

  /**
   * Original node where the conponent was configured
   */

  private originalNode: HTMLElement;

  /**
   * Current rendered node
   */

  private currentNode: HTMLElement;

  /**
   * The loaded component object
   */

  private component: Component;

  /**
   * Currently bound view
   */

  private view: View;

  /**
   * Component context
   */

  private context: any;

  /**
   * Parent view configuration
   */

  private options: ViewOptions;

  /**
   * Component name resolution function
   */

  private resolve: ResolveComponentName;

  /**
   * @constructor
   */

  constructor(node: HTMLElement, context: any, options: ViewOptions, resolve: ResolveComponentName) {
    this.parentNode = node.parentElement;
    this.originalNode = node;
    this.currentNode = node;
    this.context = context;
    this.resolve = resolve;
    this.options = options;

    const name = node.tagName.toLowerCase();
    if (name === "component") {
      this.path = node.getAttribute("is");
    } else {
      this.path = "__";
      this.component = this.resolve(name);
    }
  }

  /**
   * Bind the component
   */

  public bind(): void {
    if (this.component) {
      // DOM and data-binding both not initialized
      if (this.component.create) {
        this.component.create();
      }

      // create the container node for this component
      this.currentNode = document.createElement("component");
      this.currentNode.outerHTML = this.component.template;

      // inject the node into the correct place
      this.parentNode.replaceChild(this.currentNode, this.originalNode);

      // now the DOM is initialized
      if (this.component.attach) {
        this.component.attach(this.currentNode);
      }

      // bind the component view
      this.view = new View(this.currentNode, this.context, this.options);
      this.view.bind();

      // data-binding and DOM both initialized
      if (this.component.bind) {
        this.component.bind(this.view);
      }
    }
  }

  /**
   * Chaneg the current component
   */

  public write(value: string): void {
    if (this.component) {
      this.unbind();
    }
    this.component = this.resolve(value);
    this.bind();
  }

  /**
   * Disable data-binding and restore the DOM
   */

  public unbind(): void {
    // DOM and data-binding still ok
    if (this.component.unbind) {
      this.component.unbind(this.view);
    }

    // unbind the view
    this.view.unbind();

    // data-binding is dead
    if (this.component.detach) {
      this.component.detach(this.currentNode);
    }

    // restore the original node
    this.parentNode.replaceChild(this.originalNode, this.currentNode);

    // DOM restored and data-binding not running
    if (this.component.destroy) {
      this.component.destroy();
    }
  }

}
