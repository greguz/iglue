import { IDirective } from "../IDirective";
import { View } from "../View";

/**
 * TODO docs
 */

function prepareTemplateNode(template: string): HTMLElement { // TODO remove container
  const div = document.createElement("div");
  div.innerHTML = template;
  return div;
}

/**
 * Component interface
 */

export interface IComponent {
  template: string;
  create?(): void;
  attach?(el: HTMLElement): void;
  bind?(view: View): void;
  unbind?(view: View): void;
  detach?(el: HTMLElement): void;
  destroy?(): void;
}

/**
 * TODO docs
 */

export type ResolveComponentName = (name: string) => IComponent;

/**
 * Manage the component lifecycle
 */

export class ComponentDirective implements IDirective {

  /**
   * TODO docs
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

  private component: IComponent;

  /**
   * Current bound view
   */

  private view: View;

  /**
   * Component context
   */

  private context: any;

  /**
   * TODO docs
   */

  private resolve: ResolveComponentName;

  /**
   * @constructor
   */

  constructor(node: HTMLElement, context: any, resolve: ResolveComponentName) {
    this.parentNode = node.parentElement;
    this.originalNode = node;
    this.currentNode = node;
    this.context = context;
    this.resolve = resolve;

    if (node.hasAttribute("rv-is")) {
      this.path = node.getAttribute("rv-is");
    } else {
      this.path = "__";
      this.component = this.resolve(node.tagName.toLowerCase());
    }
  }

  /**
   * Bind the component
   */

  public bind(): void {

    if (this.component) {

      if (this.component.create) {
        this.component.create();
      }

      this.currentNode = prepareTemplateNode(this.component.template);

      this.parentNode.replaceChild(this.currentNode, this.originalNode);

      if (this.component.attach) {
        this.component.attach(this.currentNode);
      }

      this.view = new View(this.currentNode, this.context);

      this.view.bind();

      if (this.component.bind) {
        this.component.bind(this.view);
      }

    }

  }

  /**
   * TODO docs
   */

  public write(value: string): void {
    if (this.component) {
      this.unbind();
    }
    this.component = this.resolve(value);
    this.bind();
  }

  /**
   * TODO docs
   */

  public unbind(): void {

    if (this.component.unbind) {
      this.component.unbind(this.view);
    }

    this.view.unbind();

    if (this.component.detach) {
      this.component.detach(this.currentNode);
    }

    this.parentNode.replaceChild(this.originalNode, this.currentNode);

    if (this.component.destroy) {
      this.component.destroy();
    }

  }

}
