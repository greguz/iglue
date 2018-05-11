import { IComponent } from "../interfaces/IComponent";
import { IDirective } from "../interfaces/IDirective";
import { IView } from "../interfaces/IView";

import { buildHTML } from "../htmlParser";

function parseTemplate(component: IComponent, context: object): HTMLElement {
  if (component.render) {
    return component.render.call(context);
  } else if (component.template) {
    return buildHTML(component.template);
  } else {
    throw new Error("Invalid component template detected");
  }
}

export interface IComponentDirectiveOptions {
  node: HTMLElement;
  context: object;
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
  const context: any = options.context;

  // true if the component is not static
  const dynamic: boolean = options.node.tagName === "COMPONENT";

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

    // create the component HTML node
    const componentNode: HTMLElement = parseTemplate(component, context);

    // remove current node from DOM
    currentNode.parentElement.replaceChild(componentNode, currentNode);

    // call DOM attach hook
    if (component.attach) {
      component.attach.call(context, componentNode);
    }

    // create a new view for this component
    const view: IView = options.view(componentNode, context);

    // bound the view
    view.bind();

    // call last life hook
    if (component.bind) {
      component.bind.call(context, view);
    }

    // update status
    currentName = name;
    currentComponent = component;
    currentNode = componentNode;
    currentView = view;
  }

  /**
   * Triggered on directive creation
   */

  function bind(): void {
    // nothing to do
  }

  /**
   * Triggered when the model has changed
   */

  function refresh(): void {
    if (dynamic) {
      const cName: string = context.is;
      if (currentName !== cName) {
        if (currentComponent) {
          unmount();
        }
        mount(cName);
      } else if (!currentComponent) {
        throw new Error(`Unable to load dynamic component`);
      }
    } else if (currentView) {
      currentView.refresh();
    } else {
      mount(options.node.tagName.toLowerCase());
    }
  }

  /**
   * Triggered when the directive is dying
   */

  function unbind(): void {
    unmount();
    currentNode.parentElement.replaceChild(options.node, currentNode);
    currentNode = options.node;
  }

  // return the directive
  return {
    bind,
    refresh,
    unbind
  };
}
