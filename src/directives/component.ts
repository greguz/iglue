import { Application } from "../interfaces/Application";
import { Component } from "../interfaces/Component";
import { Directive } from "../interfaces/Directive";
import { Expression } from "../interfaces/Expression";
import { View } from "../interfaces/View";

import {
  parseAttributes,
  parseAttributeValue,
  parseDirective
} from "../parse/attribute";
import { buildExpressionGetter, observeExpression } from "../parse/expression";
import { buildHTML } from "../parse/html";

import { getAttributes, parentElement } from "../utils/dom";
import { assign, isFunction, isObject, noop } from "../utils/language";
import { Collection, Getter } from "../utils/type";

/**
 * Component event handler
 */
type Handler = (this: any, ...args: any[]) => any;

/**
 *
 */
type Handlers = Collection<Getter<Handler>>;

/**
 * Property binding definition
 */
interface Property extends Expression {
  name: string;
}

/**
 *
 */
interface CA extends Application {
  handlers: Handlers;
  properties: Property[];
}

/**
 *
 */
interface State {
  el: HTMLElement;
  name: string;
  view: View;
  component: Component;
  unobserve: VoidFunction;
}

/**
 *
 */
function getProperties(app: Application, el: HTMLElement): Property[] {
  return getAttributes(el)
    .filter(attr => !parseDirective(attr.name))
    .map(attr => ({ ...parseAttributeValue(attr.value), name: attr.name }));
}

/**
 *
 */
function getHandlers(app: Application, el: HTMLElement): Handlers {
  const { formatters } = app;

  return parseAttributes(el)
    .filter(attr => attr.directive === "on")
    .reduce<Handlers>((handlers, attr) => {
      if (attr.argument) {
        handlers[attr.argument] = buildExpressionGetter<Handler>(
          attr,
          formatters
        );
      }
      return handlers;
    }, {});
}

/**
 *
 */
function buildApp(app: Application, el: HTMLElement): CA {
  return {
    ...app,
    properties: getProperties(app, el),
    handlers: getHandlers(app, el)
  };
}

/**
 * $emit API of component context
 */
function $emit(app: CA, event: string, ...args: any[]): void {
  const { handlers, context } = app;

  const handler = handlers[event];

  if (handler) {
    const listener = handler.call(context);

    if (isFunction(listener)) {
      listener.apply(context, args);
    }
  }
}

/**
 *
 */
function getComponent(app: CA, name: string): Component {
  const definition = app.components[name];
  if (isObject(definition)) {
    return definition;
  } else {
    throw new Error(`Unable to find component "${name}"`);
  }
}

/**
 * Create the component HTML element
 */
function buildComponentElement(
  component: Component,
  context: any
): HTMLElement {
  if (component.render && component.template) {
    throw new Error("Over specialized component");
  } else if (component.render) {
    return component.render.call(context);
  } else if (component.template) {
    return buildHTML(component.template);
  } else {
    throw new Error("Empty component");
  }
}

/**
 * Make a property reactive between two objects
 */
function linkProperty(app: CA, target: any, property: Property): VoidFunction {
  const { context, formatters } = app;

  const get = buildExpressionGetter(property, formatters).bind(context);

  function update() {
    target[property.name] = get();
  }

  update();

  return observeExpression(context, property, update);
}

/**
 * Make reactive component context (parent>to>child)
 */
function linkProperties(app: CA, target: any): VoidFunction {
  return app.properties
    .map(property => linkProperty(app, target, property))
    .reduce(
      (acc, fn) => () => {
        acc();
        fn();
      },
      noop
    );
}

/**
 * Mount a component and start data binding
 */
function mount(app: CA, name: string): State {
  // Fetch component object
  const component: Component = getComponent(app, name);

  // Create base component context
  const context = component.data ? component.data.call(null) : {};

  // Assign methods to context
  if (component.methods) {
    assign(context, component.methods);
  }

  // Inject $emit API
  Object.defineProperty(context, "$emit", { value: $emit.bind(null, app) });

  // Make component context reactive
  const unobserve = linkProperties(app, context);

  // Trigger creation hook
  if (component.create) {
    component.create.call(context);
  }

  // Render the component inside the DOM
  const el = buildComponentElement(component, context);
  const view = app.buildView(el, context);

  // Save component element inside the context
  Object.defineProperty(context, "$el", {
    configurable: true,
    value: el
  });

  // Triggere "DOM ready" hook
  if (component.bind) {
    component.bind.call(context);
  }

  // Return current state
  return {
    name,
    component,
    view,
    el,
    unobserve
  };
}

/**
 * Unmount and stop current component data binding
 */
function unmount(app: CA, state: State): State {
  const { component, view } = state;
  const { context } = view;

  // Trigger destruction hook
  if (component.unbind) {
    component.unbind.call(context);
  }

  // Destroy DOM elements
  view.unbind();

  // Trigger hook
  if (component.destroy) {
    component.destroy.call(context);
  }

  // Stop context reactivity
  state.unobserve();

  return state;
}

/**
 * First component render, create a new state
 */
function create(app: CA, el: HTMLElement, componentName: string): State {
  const parent = parentElement(el);

  const state = mount(app, componentName);
  parent.replaceChild(state.el, el);
  if (state.component.attach) {
    state.component.attach.call(state.view.context);
  }

  return state;
}

/**
 * Swap current component with another
 */
function swap(app: CA, currentState: State, componentName: string) {
  const parent = parentElement(currentState.el);

  const newState = mount(app, componentName);
  if (currentState.component.detach) {
    currentState.component.detach.call(currentState.view.context);
  }
  parent.replaceChild(newState.el, currentState.el);
  if (newState.component.attach) {
    newState.component.attach.call(newState.view.context);
  }
  unmount(app, currentState);

  return newState;
}

/**
 * Destroy current component
 */
function destroy(app: CA, state: State, el: HTMLElement) {
  const parent = parentElement(state.el);

  if (state.component.detach) {
    state.component.detach.call(state.view.context);
  }
  unmount(app, state);

  parent.replaceChild(el, state.el);
}

/**
 * Build component directive info
 */
function buildDirectiveExpression(el: HTMLElement): Expression {
  return el.hasAttribute("is")
    ? parseAttributeValue(el.getAttribute("is") as string)
    : {
        target: {
          type: "primitive",
          value: el.tagName.toLowerCase()
        },
        formatters: [],
        watch: []
      };
}

/**
 * Build component directive
 */
export function buildComponentDirective(
  app: Application,
  el: HTMLElement
): Directive {
  const expression = buildDirectiveExpression(el);
  const cap = buildApp(app, el);

  let state: State | undefined;

  function update(componentName: any) {
    if (!state) {
      state = create(cap, el, componentName);
    } else if (state.name !== componentName) {
      state = swap(cap, state, componentName);
    } else {
      state.view.update();
    }
  }

  function unbind() {
    if (state) {
      destroy(cap, state, el);
      state = undefined;
    }
  }

  return {
    ...expression,
    update,
    unbind
  };
}
