import { IBinding } from "../interfaces/IBinding";
import { IComponent } from "../interfaces/IComponent";
import { IDirective } from "../interfaces/IDirective";
import { IView } from "../interfaces/IView";

export interface IComponentDirectiveOptions {
  node: HTMLElement;
  bindings: IBinding[];
  components: (name: string) => IComponent;
  view: (el: HTMLElement, data: object) => IView;
}

export function buildComponentDirective(options: IComponentDirectiveOptions): IDirective {
  // node present inside the DOM
  let currentNode: HTMLElement = options.node;

  // current component name
  let currentName: string;

  // bound component view
  let currentView: IView;

  // current component definition object
  let currentComponent: IComponent;

  // component context
  const context: any = {};

  // true if the component is not static
  const dynamic: boolean = options.node.tagName === "COMPONENT";

  /**
   * Sync context with current values
   */

  function refreshContext() {
    for (const binding of options.bindings) {
      context[binding.path] = binding.get();
    }
  }

  /**
   * Unmount and stop current component data binding
   */

  function unmount(): void {
    // DOM and data-binding still ok
    if (currentComponent.unbind) {
      currentComponent.unbind.call(context, currentView);
    }

    // unbind the view
    currentView.unbind();

    // data-binding is dead
    if (currentComponent.detach) {
      currentComponent.detach.call(context, currentNode);
    }

    // DOM restored and data-binding not running
    if (currentComponent.destroy) {
      currentComponent.destroy.call(context);
    }

    // delete current component
    currentName = undefined;
    currentComponent = undefined;
    currentView = undefined;
  }

  /**
   * Mount a component and start data binding
   */

  function mount(name: string): void {
    // resolve component name
    const component: IComponent = options.components(name);

    // call creation hook
    if (component.create) {
      component.create.call(context);
    }

    // fetch template from component
    const template: string = component.template.call(context);

    // inject the template into DOM
    currentNode.insertAdjacentHTML("beforebegin", template);

    // get the created component node
    const node: HTMLElement = currentNode.previousSibling as HTMLElement;

    // remove current node from DOM
    currentNode.parentElement.removeChild(currentNode);

    // call DOM attach hook
    if (component.attach) {
      component.attach.call(context, currentNode);
    }

    // create a new view for this component
    const view: IView = options.view(currentNode, context);

    // bound the view
    view.bind();

    // call last life hook
    if (component.bind) {
      component.bind.call(context, currentView);
    }

    // update status
    currentName = name;
    currentComponent = component;
    currentNode = node;
    currentView = view;
  }

  /**
   * Triggered on directive creation
   */

  function bind(): void {
    if (!dynamic) {
      mount(options.node.tagName.toLowerCase());
    }
  }

  /**
   * Triggered when the model has changed
   */

  function routine(): void {
    refreshContext();
    if (dynamic) {
      if (currentName !== context.is) {
        if (currentComponent) {
          unmount();
        }
        mount(context.is);
      }
    }
  }

  /**
   * Triggered when the directive is dying
   */

  function unbind(): void {
    unmount();
    currentNode = currentNode.replaceChild(options.node, currentNode);
  }

  // return the directive
  return {
    bind,
    routine,
    unbind
  };
}
