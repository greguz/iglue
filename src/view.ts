import { App } from "./interfaces/App";
import { Binder, BinderRoutine } from "./interfaces/Binder";
import { Component } from "./interfaces/Component";
import { Directive } from "./interfaces/Directive";
import { Formatter, FormatterFunction } from "./interfaces/Formatter";
import { View } from "./interfaces/View";

import {
  getAttributeByDirective,
  getPrefixRegExp,
  matchPrefix
} from "./parse/attribute";
import { getExpressionGetter, observeExpression } from "./parse/expression";
import { parseText } from "./parse/text";

import { buildContext } from "./context";

import { buildBinderDirective } from "./directives/binder";
import { buildComponentDirective } from "./directives/component";
import { buildConditionalDirective } from "./directives/conditional";
import { buildListDirective } from "./directives/list";
import { buildTextDirective } from "./directives/text";

import { Collection, getAttributes } from "./utils";

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
    if (onElement(el) === true) {
      for (let i = 0; i < el.childNodes.length; i++) {
        traverseDOM(el.childNodes[i], onText, onElement);
      }
    }
  }
}

/**
 * Build all possible binders directive from DOM element
 */
function buildBinderDirectives(this: App, el: HTMLElement): Directive[] {
  return getAttributes(el)
    .map(attr => attr.name)
    .filter(attrName => matchPrefix(this.prefix, attrName))
    .map(attrName => buildBinderDirective.call(this, el, attrName));
}

/**
 * Build text directives from text node
 */
function buildTextDirectives(this: App, node: Text): Directive[] {
  // IE11 fix, use parentNode instead of parentElement
  // https://developer.mozilla.org/en-US/docs/Web/API/Node/parentElement
  const parent = node.parentNode as HTMLElement;

  // Remove origianl text node
  parent.removeChild(node);

  return (
    parseText(node.data, /{([^}]+)}/g)
      // Set in place all text nodes
      .map(chunk => ({
        ...chunk,
        node: parent.insertBefore(document.createTextNode(chunk.content), node)
      }))
      // Get dynamic nodes
      .filter(chunk => chunk.type === "expression")
      // Map node to directive
      .map(chunk => buildTextDirective.call(this, chunk.node))
  );
}

/**
 * Make reactive a directive and return its subscription
 */
function buildSubscription(app: App, directive: Directive) {
  const { context, formatters } = app;

  // Directive value getter function
  const get = getExpressionGetter(formatters, directive);

  // Render the directive
  function update() {
    directive.update.call(app, get.call(context));
  }

  // Make directive reactive and get the ticket
  const unobserve = observeExpression(context, directive, update);

  // Clean function
  function unbind() {
    unobserve();
    directive.unbind.call(app);
  }

  // Return composed subscription
  return {
    update,
    unbind
  };
}

/**
 * Create a new view
 */
export function buildView(
  el: HTMLElement,
  obj: any,
  prefix: string | RegExp,
  binders: Collection<Binder | BinderRoutine>,
  components: Collection<Component>,
  formatters: Collection<Formatter | FormatterFunction>
): View {
  // Build view context
  const context = buildContext(obj);

  // Cache prefix regular expression
  const prefixRegExp = getPrefixRegExp(prefix);

  // Create the app instance
  const app: App = {
    binders,
    components,
    context,
    formatters,
    prefix: prefixRegExp,
    buildView: (a: HTMLElement, b?: any) =>
      buildView(a, b || context, prefix, binders, components, formatters)
  };

  // Build view directives
  const directives: Directive[] = [];
  traverseDOM(
    el,
    text => {
      directives.push(...buildTextDirectives.call(app, text));
    },
    child => {
      const eachAttr = getAttributeByDirective(prefixRegExp, child, "each");
      const ifAttr = getAttributeByDirective(prefixRegExp, child, "if");
      const cName = child.nodeName.toLowerCase();

      if (eachAttr) {
        directives.push(buildListDirective.call(app, child, eachAttr));
      } else if (ifAttr) {
        directives.push(buildConditionalDirective.call(app, child, ifAttr));
      } else if (cName === "component" || components.hasOwnProperty(cName)) {
        directives.push(buildComponentDirective.call(app, child));
      } else {
        directives.push(...buildBinderDirectives.call(app, child));

        // Keep DOM scanning
        return true;
      }
    }
  );

  // Make directives reactive and get subscriptions
  const subscriptions = directives.map(directive =>
    buildSubscription(app, directive)
  );

  // Multiple void functions to single function reducer
  const reducer = (accumulator: VoidFunction, fn: VoidFunction) => {
    return () => {
      accumulator();
      fn();
    };
  };

  // Build view#update method
  const update = subscriptions.map(sub => sub.update).reduce(reducer);

  // Build view#unbind method
  const unbind = subscriptions.map(sub => sub.unbind).reduce(reducer);

  // First render
  update();

  // Return view instance
  return {
    el,
    context,
    update,
    unbind
  };
}
