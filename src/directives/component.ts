import { Application } from "../interfaces/Application";
import { Component, WatchHandler } from "../interfaces/Component";
import { Directive } from "../interfaces/Directive";
import { Expression } from "../interfaces/Expression";
import { View } from "../interfaces/View";

import { parseArgument, parseDirective } from "../libs/attribute";
import {
  buildExpressionGetter,
  observeExpression,
  wrapError
} from "../libs/engine";
import { parseExpression } from "../libs/expression";
import { buildHTML } from "../libs/html";

import { voidReducer } from "../utils/array";
import { getAttributes, parentElement } from "../utils/dom";
import { isFunction, isObject, noop } from "../utils/language";
import { assign } from "../utils/object";
import { Collection } from "../utils/type";

/**
 * Extended application with component utils
 */
interface CA extends Application {
  events: Collection<Expression>;
  properties: Collection<Expression>;
}

/**
 * Component state
 */
interface State {
  // Current component DOM element
  el: HTMLElement;
  // Current component name
  name: string;
  // Current rendered view
  view: View;
  // Source component definition
  component: Component;
  // Stop data observation callback
  unobserve: VoidFunction;
}

/**
 * Build the custom component application
 */
function buildApp(app: Application, el: HTMLElement): CA {
  const events: Collection<Expression> = {};
  const properties: Collection<Expression> = {};

  for (const attribute of getAttributes(el)) {
    const directive = parseDirective(attribute.value);
    const argument = parseArgument(attribute.value);

    if (!directive) {
      properties[attribute.name] = parseExpression(attribute.value);
    } else if (directive === "on" && argument) {
      events[argument] = parseExpression(attribute.value);
    }
  }

  return assign({}, app, {
    events,
    properties
  });
}

/**
 * $emit component API
 */
function $emit(app: CA, event: string, ...args: any[]): void {
  const { context, events, formatters } = app;

  const expression = events[event];
  if (!expression) {
    return;
  }

  const handler = buildExpressionGetter(expression, formatters).call(context);
  if (!isFunction(handler)) {
    throw new Error(`Found an invalid handler for event "${event}"`);
  }

  handler.apply(context, args);
}

/**
 * Get component by name
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
 * Make a property reactive (parent to child only)
 */
function linkProperty(
  app: CA,
  target: any,
  property: string,
  expression: Expression
): VoidFunction {
  const { context, formatters } = app;

  const get = buildExpressionGetter(expression, formatters).bind(context);

  function update() {
    target[property] = get();
  }

  update();

  return observeExpression(context, expression, update);
}

/**
 * Make component context reactive
 */
function linkProperties(app: CA, target: any): VoidFunction {
  const { properties } = app;

  let unobserve: VoidFunction = noop;
  for (const property in properties) {
    unobserve = voidReducer(
      unobserve,
      linkProperty(app, target, property, properties[property] as Expression)
    );
  }

  return unobserve;
}

/**
 * Build descriptor by computer property definition
 */
function buildComputedProperty(definition: any): PropertyDescriptor {
  return {
    configurable: true,
    enumerable: true,
    get: isFunction(definition) ? definition : definition.get,
    set: isFunction(definition)
      ? wrapError("You cannot set this property")
      : definition.set
  };
}

/**
 * Register watch handler
 */
function registerWatchHandler(
  context: any,
  path: string,
  handler: WatchHandler
): VoidFunction {
  return observeExpression(
    context,
    {
      formatters: [],
      target: {
        type: "path",
        value: path
      },
      watch: []
    },
    handler.bind(context)
  );
}

/**
 * Mount a component and start data binding
 */
function mount(app: CA, componentName: string): State {
  // Fetch component object
  const component = getComponent(app, componentName);

  // Create base component context
  const context = component.data ? component.data.call(null) : {};

  // Assign methods to context
  if (component.methods) {
    assign(context, component.methods);
  }

  // Apply computed properties
  if (component.computed) {
    for (const property in component.computed) {
      Object.defineProperty(
        context,
        property,
        buildComputedProperty(component.computed[property])
      );
    }
  }

  // Inject $emit API
  Object.defineProperty(context, "$emit", { value: $emit.bind(null, app) });

  // Make component context reactive
  let unobserve = linkProperties(app, context);

  // Register watch handlers
  if (component.watch) {
    for (const path in component.watch) {
      unobserve = voidReducer(
        unobserve,
        registerWatchHandler(context, path, component.watch[path] as any)
      );
    }
  }

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
    name: componentName,
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
    ? parseExpression(el.getAttribute("is") as string)
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
  const ca = buildApp(app, el);

  let state: State | undefined;

  function update(componentName: any) {
    if (!state) {
      state = create(ca, el, componentName);
    } else if (state.name !== componentName) {
      state = swap(ca, state, componentName);
    } else {
      state.view.update();
    }
  }

  function unbind() {
    if (state) {
      destroy(ca, state, el);
      state = undefined;
    }
  }

  return {
    expression,
    update,
    unbind
  };
}
