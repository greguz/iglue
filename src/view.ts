import { AttributeValueInfo, AttributeInfo } from "./interfaces/AttributeInfo";
import { Binder, BinderRoutine } from "./interfaces/Binder";
import { Component } from "./interfaces/Component";
import { Context } from "./interfaces/Context";
import { Directive } from "./interfaces/Directive";
import { Formatter, FormatterFunction } from "./interfaces/Formatter";
import { View } from "./interfaces/View";

import {
  Collection,
  assign,
  isFunction,
  isObject,
  getAttributes,
  noop
} from "./utils";

import {
  getAttributeByDirective,
  getPrefixRegExp,
  matchPrefix,
  parseAttribute,
  parseAttributeValue
} from "./parse/attribute";
import {
  getExpressionGetter,
  getExpressionSetter,
  observeExpression
} from "./parse/expression";
import { parseText } from "./parse/text";

import { getContext } from "./context";

import { getBinderDirective } from "./directives/binder";
import { getComponentDirective } from "./directives/component";
import { getConditionalDirective } from "./directives/conditional";
import { getListDirective } from "./directives/list";
import { getTextDirective } from "./directives/text";

/**
 * Traverse DOM nodes
 */
function traverseDOM(
  node: Node,
  onText: (text: Text) => any,
  onElement: (el: HTMLElement) => boolean | undefined | void
): void {
  if (node.nodeType === 3) {
    onText(node as Text);
  } else if (node.nodeType === 1) {
    const el = node as HTMLElement;
    const go = onElement(el);
    if (go === true) {
      for (let i = 0; i < el.childNodes.length; i++) {
        traverseDOM(el.childNodes[i], onText, onElement);
      }
    }
  }
}

/**
 * Get component by name
 */
export function getComponent(
  components: Collection<Component>,
  name: string
): Component {
  const definition = components[name];
  if (isObject(definition)) {
    return definition;
  } else {
    throw new Error(`Unable to find component "${name}"`);
  }
}

/**
 * Get and normalize a binder
 */
function getBinder(
  binders: Collection<Binder | BinderRoutine>,
  name: string
): Binder {
  const definition = binders[name];

  if (isFunction(definition)) {
    return { routine: definition };
  } else if (isObject(definition)) {
    return definition;
  } else {
    return {
      routine(el: HTMLElement, value: any): void {
        if (value === undefined || value === null) {
          el.removeAttribute(name);
        } else {
          el.setAttribute(name, value.toString());
        }
      }
    };
  }
}

/**
 * Represents a reactive DOM element
 */
interface Subscription {
  refresh(): void;
  unbind(): void;
}

/**
 * Make reactive a directive and return a subscription
 */
function getSubscription(
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>,
  directive: Directive,
  expression: AttributeValueInfo
): Subscription {
  const get = getExpressionGetter(formatters, expression);

  function refresh() {
    directive.refresh(get.call(context));
  }

  const unobserve = observeExpression(context, expression, refresh);

  function unbind() {
    unobserve();
    directive.unbind();
  }

  return {
    refresh,
    unbind
  };
}

/**
 * Create single binder subscription
 */
function getBinderSubscription(
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>,
  binders: Collection<Binder | BinderRoutine>,
  info: AttributeInfo,
  el: HTMLElement
): Subscription {
  return getSubscription(
    context,
    formatters,
    getBinderDirective(
      el,
      getBinder(binders, info.directive),
      assign(
        {
          context,
          get: getExpressionGetter(formatters, info).bind(context),
          set: getExpressionSetter(formatters, info).bind(context)
        },
        info
      )
    ),
    info
  );
}

/**
 * Each all element's attributes and create all binder subscriptions
 */
function getBindersSubscriptions(
  prefix: RegExp,
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>,
  binders: Collection<Binder | BinderRoutine>,
  el: HTMLElement
): Subscription[] {
  return getAttributes(el)
    .map(attr => attr.name)
    .filter(attrName => matchPrefix(prefix, attrName))
    .map(attrName => parseAttribute(prefix, el, attrName))
    .map(info => getBinderSubscription(context, formatters, binders, info, el));
}

/**
 * Create subscriptions for a text node element
 */
function getTextSubscriptions(
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>,
  node: Text
): Subscription[] {
  // IE11 fix, use parentNode instead of parentElement
  // https://developer.mozilla.org/en-US/docs/Web/API/Node/parentElement
  const parent = node.parentNode as HTMLElement;
  const chunks = parseText(node.data, /{([^}]+)}/g);

  const subscriptions = chunks
    // Set in place all text nodes
    .map(chunk => ({
      ...chunk,
      node: parent.insertBefore(document.createTextNode(chunk.content), node)
    }))
    // Get dynamic nodes
    .filter(chunk => chunk.type === "expression")
    // Build subscriptions
    .map(chunk =>
      getSubscription(
        context,
        formatters,
        getTextDirective(chunk.node),
        parseAttributeValue(chunk.content)
      )
    );

  // Remove origianl node
  parent.removeChild(node);

  return subscriptions;
}

/**
 * Get conditional directive subscription
 */
function getConditionalSubscription(
  getView: (el: HTMLElement) => View,
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>,
  el: HTMLElement,
  info: AttributeInfo
) {
  return getSubscription(
    context,
    formatters,
    getConditionalDirective(getView, el, info),
    info
  );
}

/**
 * Get list directive subscription
 */
function getListSubscription(
  getView: (obj: any, el: HTMLElement) => View,
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>,
  el: HTMLElement,
  info: AttributeInfo
) {
  return getSubscription(
    context,
    formatters,
    getListDirective(getView, context, el, info),
    info
  );
}

/**
 * Make a property reactive between two objects
 */
function linkProperty(
  formatters: Collection<Formatter | FormatterFunction>,
  expression: AttributeValueInfo,
  source: Context,
  target: any,
  property: string
) {
  // Source value getter
  const get = getExpressionGetter(formatters, expression);

  // Sync target property value
  function sync() {
    target[property] = get.call(source);
  }

  // Initialize the value
  sync();

  // Start source-to-target reactivity
  return observeExpression(source, expression, sync);
}

/**
 * Get component events collection from component DOM element
 */
function getComponentEvents(
  prefix: RegExp,
  formatters: Collection<Formatter | FormatterFunction>,
  el: HTMLElement
) {
  return getAttributes(el)
    .filter(attr => matchPrefix(prefix, attr.name))
    .reduce<Collection<() => Function>>((acc, attr) => {
      const info = parseAttribute(prefix, el, attr.name);

      if (info.directive === "on") {
        if (info.argument) {
          acc[info.argument.toLowerCase()] = getExpressionGetter(
            formatters,
            info
          );
        } else {
          throw new Error();
        }
      } else if (info.directive === "model") {
        const updateModelValue = getExpressionSetter(formatters, info);
        acc.value = function getter() {
          return updateModelValue;
        };
      }

      return acc;
    }, {});
}

/**
 * $emit API of component context
 */
function $emit(context: any, events: any, event: string, ...args: any[]): void {
  const getter = events[event];
  if (getter) {
    const listener = getter.call(context);
    if (isFunction(listener)) {
      listener.apply(context, args);
    }
  }
}

/**
 * Make reactive component context (parent>to>child)
 */
function linkParentContext(
  prefix: RegExp,
  formatters: Collection<Formatter | FormatterFunction>,
  source: any,
  target: any,
  el: HTMLElement
) {
  return getAttributes(el)
    .filter(attr => !matchPrefix(prefix, attr.name))
    .map(attr =>
      linkProperty(
        formatters,
        parseAttributeValue(attr.value),
        source,
        target,
        attr.name
      )
    )
    .reduce(
      (acc, current) =>
        function() {
          acc();
          current();
        },
      noop
    );
}

/**
 * Build the component subscription
 */
function getComponentSubscription(
  getView: (obj: any, el: HTMLElement) => View,
  prefix: RegExp,
  formatters: Collection<Formatter | FormatterFunction>,
  components: Collection<Component>,
  context: any,
  el: HTMLElement
): Subscription {
  // Events collection
  const events = getComponentEvents(prefix, formatters, el);

  // Component's context
  const cc: any = {};

  // Inject $emit API
  Object.defineProperty(cc, "$emit", {
    value: $emit.bind(null, cc, events)
  });

  // Make component context reactive
  const unobserve = linkParentContext(prefix, formatters, context, cc, el);

  // Build component directive
  const directive = getComponentDirective(
    getView,
    getComponent.bind(null, components),
    cc,
    el
  );

  // Currenct component name getter
  const getComponentName: () => string = el.hasAttribute("is")
    ? getExpressionGetter(
        formatters,
        parseAttributeValue(el.getAttribute("is") as string)
      ).bind(context)
    : () => el.tagName.toLowerCase();

  // Return the subscription
  return {
    refresh(): void {
      directive.refresh(getComponentName());
    },
    unbind(): void {
      unobserve();
      directive.unbind();
    }
  };
}

/**
 * Create a new view
 */
export function getView(
  prefix: string | RegExp,
  binders: Collection<Binder | BinderRoutine>,
  components: Collection<Component>,
  formatters: Collection<Formatter | FormatterFunction>,
  obj: any,
  el: HTMLElement
): View {
  // Build view context
  const context = getContext(obj);

  // Cache prefix regular expression
  const prefixRegExp = getPrefixRegExp(prefix);

  const _getView: (obj: any, el: HTMLElement) => View = getView.bind(
    null,
    prefixRegExp,
    binders,
    components,
    formatters
  );

  const _parseAttribute: (
    el: HTMLElement,
    attrName: string
  ) => AttributeInfo = parseAttribute.bind(null, prefixRegExp);

  const _getAttributeByDirective: (
    el: HTMLElement,
    directiveName: string
  ) => string | undefined = getAttributeByDirective.bind(null, prefixRegExp);

  const _getBindersSubscriptions: (
    el: HTMLElement
  ) => Subscription[] = getBindersSubscriptions.bind(
    null,
    prefixRegExp,
    context,
    formatters,
    binders
  );

  const _getComponentSubscription: (
    el: HTMLElement
  ) => Subscription = getComponentSubscription.bind(
    null,
    _getView,
    prefixRegExp,
    formatters,
    components,
    context
  );

  const _getConditionalSubscription: (
    el: HTMLElement,
    info: AttributeInfo
  ) => Subscription = getConditionalSubscription.bind(
    null,
    _getView,
    context,
    formatters
  );

  const _getListSubscription: (
    el: HTMLElement,
    info: AttributeInfo
  ) => Subscription = getListSubscription.bind(
    null,
    _getView,
    context,
    formatters
  );

  const _getTextSubscriptions: (
    node: Text
  ) => Subscription[] = getTextSubscriptions.bind(null, context, formatters);

  let subscriptions: Subscription[] = [];

  const _push: (
    ...subscriptions: Subscription[]
  ) => number = subscriptions.push.bind(subscriptions);

  traverseDOM(
    el,
    text => {
      _push(..._getTextSubscriptions(text));
    },
    child => {
      const eachAttr = _getAttributeByDirective(child, "each");
      const ifAttr = _getAttributeByDirective(child, "if");
      const cName = child.nodeName.toLowerCase();

      if (eachAttr) {
        _push(_getListSubscription(child, _parseAttribute(child, eachAttr)));
      } else if (ifAttr) {
        _push(
          _getConditionalSubscription(child, _parseAttribute(child, ifAttr))
        );
      } else if (cName === "component" || components.hasOwnProperty(cName)) {
        _push(_getComponentSubscription(child));
      } else {
        _push(..._getBindersSubscriptions(child));

        // Keep DOM scanning
        return true;
      }
    }
  );

  const reducer = (acc: Function, method: Function) => {
    return () => {
      acc();
      method();
    };
  };

  const refresh = subscriptions.map(sub => sub.refresh).reduce(reducer);

  const unbind = subscriptions.map(sub => sub.unbind).reduce(reducer);

  // First render
  refresh();

  // Return view instance
  return {
    el,
    context,
    refresh,
    unbind
  };
}
