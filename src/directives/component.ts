import { Component } from "../interfaces/Component";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { buildHTML } from "../parse/html";
import { Mapper } from "../utils";

function parseTemplate(component: Component, context: object): HTMLElement {
  if (component.render) {
    return component.render.call(context);
  } else if (component.template) {
    return buildHTML(component.template);
  } else {
    throw new Error("Invalid component template detected");
  }
}

export interface ComponentDirectiveOptions {
  el: HTMLElement;
  context: object;
  getComponent: Mapper<string, Component>;
  buildView: (el: HTMLElement, obj: object) => View;
}

export function buildComponentDirective(options: ComponentDirectiveOptions): Directive {
  // get the parent element
  const parent: HTMLElement = options.el.parentElement;

  // node present inside the DOM
  let currentElement: HTMLElement = options.el;

  // current component name
  let currentName: string;

  // bound component view
  let currentView: View;

  // current component definition object
  let currentComponent: Component;

  // component context
  const context: any = options.context;

  /**
   * Unmount and stop current component data binding
   */

  function unmount(): void {
    // DOM and data-binding still ok
    if (currentComponent.unbind) {
      currentComponent.unbind.call(context);
    }

    // unbind the view
    currentView.unbind();

    // data-binding is dead
    if (currentComponent.detach) {
      currentComponent.detach.call(context);
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
    const component: Component = options.getComponent(name);

    // call creation hook
    if (component.create) {
      component.create.call(context);
    }

    // create the component HTML node
    const componentNode: HTMLElement = parseTemplate(component, context);

    // remove current node from DOM
    parent.replaceChild(componentNode, currentElement);

    // call DOM attach hook
    if (component.attach) {
      component.attach.call(context);
    }

    // create a new view for this component
    const view: View = options.buildView(componentNode, context);

    // call last life hook
    if (component.bind) {
      component.bind.call(context);
    }

    // update status
    currentName = name;
    currentComponent = component;
    currentElement = componentNode;
    currentView = view;
  }

  /**
   * Directive#refresh
   */

  function refresh(name: string): void {
    if (name !== currentName) {
      if (currentComponent) {
        unmount();
      }
      mount(name);
    } else {
      currentView.refresh();
    }
  }

  /**
   * Directive#unbind
   */

  function unbind(): void {
    unmount();
    parent.replaceChild(options.el, currentElement);
    currentElement = options.el;
  }

  // return the directive
  return {
    refresh,
    unbind
  };
}
