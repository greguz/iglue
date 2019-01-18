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
 * Represent current component state
 */
interface State {
  el: HTMLElement;
  name: string;
  view: View;
  component: Component;
}

/**
 * Get component by name
 */
function getComponentByName(this: App, name: string): Component {
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
 * Make a property reactive between two objects
 */
function linkProperty(
  this: App,
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
function linkParentContext(
  this: App,
  target: any,
  el: HTMLElement
): VoidFunction {
  return getAttributes(el)
    .filter(attr => !matchPrefix(this.prefix, attr.name))
    .map<VoidFunction>(attr =>
      linkProperty.call(
        this,
        target,
        attr.name,
        parseAttributeValue(attr.value)
      )
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
function getComponentEvents(this: App, el: HTMLElement) {
  const { formatters, prefix } = this;

  return getAttributes(el)
    .filter(attr => matchPrefix(prefix, attr.name))
    .reduce<Collection<() => ((...args: any[]) => void)>>((events, attr) => {
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
 * $emit API of component context
 */
function $emit(this: any, events: any, event: string, ...args: any[]): void {
  const getter = events[event];
  if (getter) {
    const listener = getter.call(this);
    if (isFunction(listener)) {
      listener.apply(this, args);
    }
  }
}

/**
 * Mount a component and start data binding
 */
function mount(this: App, name: string, context: any): State {
  // Fetch component object
  const component: Component = getComponentByName.call(this, name);

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
    el
  };
}

/**
 * Unmount and stop current component data binding
 */
function unmount(this: App, state: State): State {
  const { component, view } = state;
  const { context } = view;

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
function create(this: App, name: string, context: any, el: HTMLElement): State {
  // Create a new state
  const state: State = mount.call(this, name, context);

  // Inject view element into DOM
  replaceChild(el, state.el);

  // Trigger last hook
  if (state.component.attach) {
    state.component.attach.call(context);
  }

  return state;
}

/**
 * Swap state to another
 */
function swap(this: App, name: string, state: State) {
  const parent = parentElement(state.el);
  const context = state.view.context;

  const newState: State = mount.call(this, name, context);
  const oldState: State = unmount.call(this, state);

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
function destroy(this: App, state: State, el: HTMLElement) {
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

  // Component context object
  const context: any = {};

  // Events collection
  const events = getComponentEvents.call(this, el);

  // Inject $emit API
  Object.defineProperty(context, "$emit", {
    value: $emit.bind(this.context, events)
  });

  // Make component context reactive
  const unobserve = linkParentContext.call(this, context, el);

  // Return build directive
  return {
    ...info,
    update(this: App, name: string) {
      if (!state) {
        state = create.call(this, name, context, el);
      } else if (state.name !== name) {
        state = swap.call(this, name, state);
      } else {
        state.view.update();
      }
    },
    unbind(this: App) {
      unobserve();
      if (state) {
        destroy.call(this, state, el);
        state = undefined;
      }
    }
  };
}
