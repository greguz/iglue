import { Application } from "./interfaces/Application";
import { Attribute } from "./interfaces/Attribute";
import { Binder, BinderRoutine } from "./interfaces/Binder";
import { Component } from "./interfaces/Component";
import { Directive } from "./interfaces/Directive";
import { Formatter, FormatterFunction } from "./interfaces/Formatter";
import { View } from "./interfaces/View";

import { buildContext } from "./context";

import { buildBinderDirective } from "./directives/binder";
import { buildComponentDirective } from "./directives/component";
import { buildConditionalDirective } from "./directives/conditional";
import { buildListDirective } from "./directives/list";
import { buildTextDirective } from "./directives/text";

import { parseAttributes } from "./parse/attribute";
import { buildExpressionGetter, observeExpression } from "./parse/expression";
import { parseText } from "./parse/text";

import { find } from "./utils/array";
import { parentElement } from "./utils/dom";
import { Collection } from "./utils/type";

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
function buildBinderDirectives(
  app: Application,
  el: HTMLElement,
  attributes: Attribute[]
): Directive[] {
  return attributes.map(attr => buildBinderDirective(app, el, attr));
}

/**
 * Build text directives from text node
 */
function buildTextDirectives(app: Application, node: Text): Directive[] {
  const parent = parentElement(node);
  const chunks = parseText(node.data);
  const directives: Directive[] = [];

  for (const chunk of chunks) {
    const chunkNode = document.createTextNode(chunk.content);

    parent.insertBefore(chunkNode, node);

    if (chunk.type === "expression") {
      directives.push(buildTextDirective(app, chunkNode));
    }
  }

  parent.removeChild(node);

  return directives;
}

/**
 * Build the directives list
 */
function buildDirectives(app: Application, el: HTMLElement) {
  const { components } = app;
  let directives: Directive[] = [];

  traverseDOM(
    el,
    text => {
      directives = directives.concat(buildTextDirectives(app, text));
    },
    child => {
      const attributes = parseAttributes(child);

      const eachAttr = find(attributes, attr => attr.directive === "each");
      if (eachAttr) {
        directives.push(buildListDirective(app, child, eachAttr));
        return;
      }

      const ifAttr = find(attributes, attr => attr.directive === "if");
      if (ifAttr) {
        directives.push(buildConditionalDirective(app, child, ifAttr));
        return;
      }

      const cName = child.nodeName.toLowerCase();
      if (cName === "component" || components.hasOwnProperty(cName)) {
        directives.push(buildComponentDirective(app, child));
        return;
      }

      directives = directives.concat(
        buildBinderDirectives(app, child, attributes)
      );
      return true;
    }
  );

  return directives;
}

/**
 * Make reactive a directive and return its subscription
 */
function buildSubscription(app: Application, directive: Directive) {
  const { context, formatters } = app;

  const get = buildExpressionGetter(directive, formatters);

  function update() {
    directive.update(get.call(context));
  }

  const unobserve = observeExpression(context, directive, update);

  function unbind() {
    unobserve();
    directive.unbind();
  }

  return {
    update,
    unbind
  };
}

/**
 * Build app object
 */
function buildApplication(
  obj: object,
  binders: Collection<Binder | BinderRoutine>,
  components: Collection<Component>,
  formatters: Collection<Formatter | FormatterFunction>
): Application {
  const context = buildContext(obj);

  return {
    binders,
    components,
    context,
    formatters,
    buildView: (el: HTMLElement, newObj?: object) =>
      buildView(el, newObj || context, binders, components, formatters)
  };
}

/**
 * Create a new view
 */
export function buildView(
  el: HTMLElement,
  obj: object,
  binders: Collection<Binder | BinderRoutine>,
  components: Collection<Component>,
  formatters: Collection<Formatter | FormatterFunction>
): View {
  const app = buildApplication(obj, binders, components, formatters);

  const subscriptions = buildDirectives(app, el).map(directive =>
    buildSubscription(app, directive)
  );

  const reducer = (accumulator: VoidFunction, fn: VoidFunction) => {
    return () => {
      accumulator();
      fn();
    };
  };

  // View APIs
  const update = subscriptions.map(sub => sub.update).reduce(reducer);
  const unbind = subscriptions.map(sub => sub.unbind).reduce(reducer);

  // First render
  update();

  // View instance
  return {
    el,
    context: app.context,
    update,
    unbind
  };
}
