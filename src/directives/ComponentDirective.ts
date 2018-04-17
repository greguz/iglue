import { IBinding } from "../interfaces/IBinding";
import { IComponent } from "../interfaces/IComponent";
import { IDirective } from "../interfaces/IDirective";

import { View } from "../View";



















export interface IComponentDirectiveOptions {
  node: HTMLElement;
  bindings: IBinding[];
  components: (name: string) => IComponent;
  view: (el: HTMLElement, data: object) => View;
}

export class ComponentDirective implements IDirective {

  private parentNode: HTMLElement;
  private originalNode: HTMLElement;
  private currentNode: HTMLElement;
  private component: IComponent;
  private view: View;
  private context: any;

  private isBinding: IBinding;

  private bindings: IBinding[];

  private getComponentPrototoype: (name: string) => IComponent;
  private buildView: (el: HTMLElement, data: object) => View;

  /**
   * @constructor
   */

  constructor(options: IComponentDirectiveOptions) {

    const node: HTMLElement = options.node;

    this.parentNode = node.parentElement;
    this.originalNode = node;
    this.currentNode = node;

    this.context = context;

    this.bindings = options.bindings;
    this.getComponentPrototoype = options.components;
    this.buildView = options.view;



  }

  /**
   * Bind the component
   */

  public bind(): void {

    const nodeName = this.originalNode.tagName.toLowerCase();

    let componentName: string;

    if (nodeName === "component") {

      const binding = this.bindings.find(
        (b: IBinding): boolean => b.path === "is"
      );

      if (binding) {
        componentName = binding.get();
      } else {
        throw new Error("Missing is attribute");
      }

    } else {
      componentName = nodeName;
    }

    this.component = this.getComponentPrototoype(componentName);




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

  public routine(): void {
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
