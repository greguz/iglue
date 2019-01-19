import { App } from "../interfaces/App";
import { AttributeValueInfo } from "../interfaces/AttributeInfo";
import { Component } from "../interfaces/Component";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import {
  matchPrefix,
  parseAttribute,
  parseAttributeValue
} from "../parse/attribute";
import { getExpressionGetter, observeExpression } from "../parse/expression";
import { buildHTML } from "../parse/html";

import {
  Collection,
  getAttributes,
  isFunction,
  isObject,
  noop,
  parentElement,
  replaceChild
} from "../utils";

/**
 * Getters collection to retrieve all configured event listeners
 */
type Events = Collection<() => Function>;

/**
 * Property binding
 */
interface Binding {
  property: string;
  expression: AttributeValueInfo;
}

/**
 * Extended app for component
 */
interface Cap extends App {
  bindings: Binding[];
  events: Events;
}

/**
 * $emit API of component context
 */
function $emit(this: Cap, event: string, ...args: any[]): void {
  const getter = this.events[event];
  if (getter) {
    const listener = getter.call(this.context);
    if (isFunction(listener)) {
      listener.apply(this.context, args);
    }
  }
}

/**
 * Represent current component state
 */
interface State {
  el: HTMLElement;
  name: string;
  view: View;
  component: Component;
  unobserve: VoidFunction;
}

/**
 * Get component by name
 */
function getComponentByName(this: Cap, name: string): Component {
  const definition = this.components[name];
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
    throw new Error("Invalid component template detected");
  }
}

/**
 * Get bindings from DOM element
 */
function getBindings(this: Cap, el: HTMLElement): Binding[] {
  return getAttributes(el)
    .filter(attr => !matchPrefix(this.prefix, attr.name))
    .map(attr => ({
      property: attr.name,
      expression: parseAttributeValue(attr.value)
    }));
}

/**
 * Make a property reactive between two objects
 */
function linkProperty(
  this: Cap,
  target: any,
  property: string,
  expression: AttributeValueInfo
): VoidFunction {
  const { context, formatters } = this;

  // Source value getter
  const get = getExpressionGetter(formatters, expression).bind(context);

  // Sync target property value
  const sync = (target[property] = get());

  // Initialize the value
  sync();

  // Start source-to-target reactivity
  return observeExpression(context, expression, sync);
}

/**
 * Make reactive component context (parent>to>child)
 */
function linkProperties(this: Cap, target: any): VoidFunction {
  return this.bindings
    .map<VoidFunction>(binding =>
      linkProperty.call(this, target, binding.property, binding.expression)
    )
    .reduce(
      (acc, fn) => () => {
        acc();
        fn();
      },
      noop
    );
}

/**
 * Get component events collection from component DOM element
 */
function getEvents(this: Cap, el: HTMLElement) {
  const { formatters, prefix } = this;

  return getAttributes(el)
    .filter(attr => matchPrefix(prefix, attr.name))
    .reduce<Events>((events, attr) => {
      const info = parseAttribute(prefix, el, attr.name);

      if (info.directive === "on") {
        if (info.argument) {
          events[info.argument] = getExpressionGetter(formatters, info);
        } else {
          throw new Error("Invalid directive");
        }
      }

      return events;
    }, {});
}

/**
 * Mount a component and start data binding
 */
function mount(this: Cap, name: string): State {
  // Fetch component object
  const component: Component = getComponentByName.call(this, name);

  // Create component context
  const context: any = component.data ? component.data.call(null) : {};
  if (!isObject(context)) {
    throw new Error("Component data is not an object");
  }

  // Inject $emit API
  Object.defineProperty(context, "$emit", { value: $emit.bind(this) });

  // Make component context reactive (parent > child)
  const unobserve = linkProperties.call(this, context);

  // First hook
  if (component.create) {
    component.create.call(context);
  }

  // Setup component DOM
  const el = buildComponentElement(component, context);
  const view = this.buildView(el, context);

  // Inject view element
  Object.defineProperty(context, "$el", {
    configurable: true,
    value: el
  });

  // Second hook
  if (component.bind) {
    component.bind.call(context);
  }

  // Return build state
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
function unmount(this: Cap, state: State): State {
  const { component, view } = state;
  const { context } = view;

  // Stop reactivity
  state.unobserve();

  // Trigger first hook
  if (component.unbind) {
    component.unbind.call(context);
  }

  // Destroy the current view
  view.unbind();

  // Trigger second hook
  if (component.destroy) {
    component.destroy.call(context);
  }

  return state;
}

/**
 * Create first state
 */
function create(this: Cap, name: string, el: HTMLElement): State {
  // Create a new state
  const state: State = mount.call(this, name);

  // Inject view element into DOM
  replaceChild(el, state.el);

  // Trigger last hook
  if (state.component.attach) {
    state.component.attach.call(state.view.context);
  }

  return state;
}

/**
 * Swap state to another
 */
function swap(this: Cap, name: string, state: State) {
  const parent = parentElement(state.el);

  const newState: State = mount.call(this, name);
  const oldState: State = unmount.call(this, state);

  if (oldState.component.detach) {
    oldState.component.detach.call(oldState.view.context);
  }
  parent.replaceChild(newState.el, oldState.el);
  if (newState.component.attach) {
    newState.component.attach.call(newState.view.context);
  }

  return newState;
}

/**
 * Destroy current state
 */
function destroy(this: Cap, state: State, el: HTMLElement) {
  const parent = parentElement(state.el);
  const context = state.view.context;

  const oldState = unmount.call(this, state);

  if (oldState.component.detach) {
    oldState.component.detach.call(context);
  }
  parent.replaceChild(el, oldState.el);
}

/**
 * Build component directive info
 */
function buildDirectiveInfo(el: HTMLElement): AttributeValueInfo {
  return el.hasAttribute("is")
    ? parseAttributeValue(el.getAttribute("is") as string)
    : {
        value: {
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
export function buildComponentDirective(this: App, el: HTMLElement): Directive {
  // Current component state
  let state: State | undefined;

  // Build this directive info
  const info = buildDirectiveInfo(el);

  // Build component application instance
  const cap: Cap = {
    ...this,
    events: getEvents.call(this, el),
    bindings: getBindings.call(this, el)
  };

  // Return build directive
  return {
    ...info,
    update(this: App, name: string) {
      if (!state) {
        state = create.call(cap, name, el);
      } else if (state.name !== name) {
        state = swap.call(cap, name, state);
      } else {
        state.view.update();
      }
    },
    unbind(this: App) {
      if (state) {
        destroy.call(cap, state, el);
        state = undefined;
      }
    }
  };
}
