import { Component } from "../interfaces/Component";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { buildHTML } from "../parse/html";
import { getParent } from "../utils";

/**
 * Represent current component state
 */
interface State {
  el: HTMLElement;
  name: string;
  view: View;
  component: Component;
}

/**
 * Create the component HTML element
 */
function parseTemplate(component: Component, context: any): HTMLElement {
  if (component.render && component.template) {
    throw new Error("over specialized component");
  } else if (component.render) {
    return component.render.call(context);
  } else if (component.template) {
    return buildHTML(component.template);
  } else {
    throw new Error("Invalid component template detected");
  }
}

/**
 * Mount a component and start data binding
 */
function mount(
  name: string,
  context: any,
  component: Component,
  buildView: (obj: any, el: HTMLElement) => View
): State {
  if (component.create) {
    component.create.call(context);
  }

  const el = parseTemplate(component, context);
  const view = buildView(context, el);

  Object.defineProperty(context, "$el", {
    configurable: true,
    value: el
  });

  if (component.bind) {
    component.bind.call(context);
  }

  return {
    name,
    component,
    view,
    el
  };
}

/**
 * Unmount and stop current component data binding
 */
function unmount(state: State): State {
  const { component, view } = state;
  const { context } = view;

  if (component.unbind) {
    component.unbind.call(context);
  }

  view.unbind();

  if (component.destroy) {
    component.destroy.call(context);
  }

  return state;
}

/**
 * Create first state
 */
function create(
  el: HTMLElement,
  name: string,
  context: any,
  component: Component,
  buildView: (obj: any, el: HTMLElement) => View
) {
  const parent = getParent(el);
  const state = mount(name, context, component, buildView);

  parent.replaceChild(state.el, el);
  if (state.component.attach) {
    state.component.attach.call(context);
  }

  return state;
}

/**
 * Swap state to another
 */
function swap(
  state: State,
  name: string,
  component: Component,
  buildView: (obj: any, el: HTMLElement) => View
) {
  const parent = getParent(state.el);
  const context = state.view.context;

  const newState = mount(name, context, component, buildView);
  const oldState = unmount(state);

  if (oldState.component.detach) {
    oldState.component.detach.call(context);
  }
  parent.replaceChild(newState.el, oldState.el);
  if (newState.component.attach) {
    newState.component.attach.call(context);
  }

  return newState;
}

/**
 * Destroy current state
 */
function destroy(state: State, el: HTMLElement) {
  const parent = getParent(state.el);
  const context = state.view.context;

  const oldState = unmount(state);

  if (oldState.component.detach) {
    oldState.component.detach.call(context);
  }
  parent.replaceChild(el, oldState.el);
}

/**
 * Build component directive
 */
export function buildComponentDirective(
  el: HTMLElement,
  context: any,
  component: (name: string) => Component,
  buildView: (obj: any, el: HTMLElement) => View
): Directive {
  let state: State | undefined;

  return {
    refresh() {
      if (!state) {
        state = create(el, name, context, component(name), buildView);
      } else if (state.name !== name) {
        state = swap(state, name, component(name), buildView);
      } else {
        state.view.refresh();
      }
    },
    unbind() {
      if (state) {
        destroy(state, el);
      }
    }
  };
}
